from flask import Flask, render_template, redirect, flash, request, jsonify, send_file
from forms import ImageUploadForm
from models import db, connect_db, Image
from sqlalchemy.exc import IntegrityError
import boto3
import requests
from io import BytesIO
from urllib.parse import urlencode
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
from PIL import Image as PillowImage
import os
from metadata_utils import get_formatted_metadata, get_metadata_for_display

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ["APPLICATION_SECRET_KEY"]
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ["DATABASE_URL"]
app.config['SQLALCHEMY_ECHO'] = False

connect_db(app)

# AWS S3 Configuration
s3 = boto3.client(
    's3',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY"),
    aws_secret_access_key=os.getenv("AWS_SECRET_KEY"),
    region_name=os.getenv("AWS_REGION"),
)


bucket_name = os.getenv("AWS_BUCKET_NAME")
base_url = f"https://{bucket_name}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/"

MAPQUEST_API_KEY = os.getenv("MAPQUEST_API_KEY")

############
## ROUTES ##
############


@app.get("/")
def homepage():
    """
    Render the homepage template.

    Returns:
        A rendered template 'home.html' for the homepage.
    """

    return render_template("home.html")


@app.route("/photos/upload", methods=["GET", "POST"])
def upload_photo():
    """
    Displays an image upload form and handles the image submission.
    If the form is submitted and validated, the image is uploaded to AWS S3
    and its metadata is saved in the database.

    Returns:
        On successful upload: Redirects to the photo viewing page and flashes
            success message.
        On failure: Reloads the upload form and flashes an error message.
    """

    form = ImageUploadForm()

    if form.validate_on_submit():

        try:
            image_file = form.image.data
            filename = secure_filename(image_file.filename)
            img = PillowImage.open(image_file)
            image_metadata = get_formatted_metadata(img)

            new_image = Image(
                filename=filename,
                gps=image_metadata["gps"],
                mode=image_metadata["mode"],
                format=image_metadata["format"],
                height=image_metadata["height"],
                width=image_metadata["width"],
                datetime=image_metadata["datetime"],
                focal_length=image_metadata["focal_length"],
                shutterspeed=image_metadata["shutterspeed"],
                aperture=image_metadata["aperture"],
                iso=image_metadata["iso"],
                fnumber=image_metadata["fnumber"],
                exposure_time=image_metadata["exposure_time"],
                lens_make=image_metadata["lens_make"],
                lens_model=image_metadata["lens_model"],
                device_make=image_metadata["device_make"],
                device_model=image_metadata["device_model"],
            )

            db.session.add(new_image)
            db.session.flush()

            image_file.seek(0)

            s3.upload_fileobj(
                image_file,
                bucket_name,
                filename
            )

            flash("Image upload successful!", "success")
            return redirect("/photos")

        except IntegrityError as err:
            print("Exception", err)
            flash("Image name already taken.", "danger")
            db.session.rollback()

        except Exception as err:
            print("Exception", err)
            flash("Image upload failed!", "danger")
            db.session.rollback()

        finally:
            db.session.commit()

    return render_template('upload_form.html', form=form)


@app.get("/photos")
def display_photos():
    """
    Fetches and displays all photos or filtered photos based on the search
    term provided in the query parameter.

    Query string args:
        searchTerm (str): Optional. A string to filter photos based on their metadata.

    Returns:
        A rendered template 'all_photos.html' displaying all or filtered photos.
    """

    search_term = request.args.get("searchTerm", "")
    if search_term:
        photos = Image.query.filter(
            Image.search_vector.ilike(f"%{search_term}%")).all()
    else:
        photos = Image.query.all()  # Return all photos if no search term is provided

    return render_template("all_photos.html", photos=photos, base_url=base_url)


@app.get("/photos/<photo_name>")
def display_photo(photo_name):
    """
    Display a single photo along with its metadata.

    URL Args:
        photo_name (str): The filename of the photo to retrieve.

    Returns:
        A rendered template 'display_photo.html' showing the photo and its metadata.
    """

    photo = Image.query.get_or_404(photo_name)

    metadata = get_metadata_for_display(photo)

    return render_template("display_photo.html", photo=photo, base_url=base_url, metadata=metadata)


@app.get("/photos/<photo_name>/edit")
def edit_photo(photo_name):
    """
    Renders an edit page for a specific photo identified by its name.

    URL Args:
        photo_name (str): The filename of the photo to edit.

    Returns:
        A rendered template 'edit_photo.html' for editing the photo.
    """

    photo = Image.query.get_or_404(photo_name)

    return render_template('edit_photo.html', photo=photo, base_url=base_url)


@app.post("/photos/<photo_name>/edit")
def upload_edited_photo(photo_name):
    """
    Handles the submission of the edited photo. Updates the photo's metadata
    and re-uploads to AWS S3.

    URL Args:
        photo_name (str): The filename of the photo being edited.

    Returns:
        JSON response indicating the outcome of the save operation.
    """

    try:
        image_file = request.files["image"]

        photo = Image.query.get(photo_name)
        photo.height = request.form["height"]
        photo.width = request.form["width"]

        db.session.commit()

        s3.upload_fileobj(
            image_file,
            bucket_name,
            photo_name
        )

        return jsonify({
            "message": "Image saved"
        })

    except Exception as ex:
        return jsonify({
            "message": ex
        })


@app.route('/get_map')
def get_map():
    """
    Generates and returns a static map image from MapQuest based on the
    provided latitude and longitude.

    Query Parameters:
        location (str): A string in the format "latitude,longitude"
            indicating the center of the map.

    Returns:
        A PNG image file of the map if successful, or an error message if failed.
    """

    [latitude, longitude] = request.args["location"].split(", ")

    params = {
        'key': MAPQUEST_API_KEY,
        'center': f"{latitude},{longitude}",
        'zoom': 11,
        'size': "600,400",
        'locations': f"{latitude},{longitude}|marker-sm-22407F-2A4DB3"
    }

    base_url = "https://www.mapquestapi.com/staticmap/v5/map"
    query_string = urlencode(params)
    map_url = f"{base_url}?{query_string}"

    response = requests.get(map_url)

    if response.status_code == 200:

        image = BytesIO(response.content)
        image.seek(0)

        return send_file(image, mimetype='image/png')
    else:
        return "Failed to fetch the map", 500
