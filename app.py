from flask import Flask, render_template, redirect, flash, request, jsonify
from forms import ImageUploadForm
from models import db, connect_db, Image
from sqlalchemy.exc import IntegrityError
import boto3
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
from PIL import Image as PillowImage
import os
from utils import get_formatted_metadata, get_metadata_for_display

app = Flask(__name__)
app.config['SECRET_KEY'] = "oh-so-secret"
app.config['UPLOAD_FOLDER'] = "./uploaded_photos"

load_dotenv()

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


@app.get("/")
def homepage():
    """Returns homepage"""

    return render_template("base.html")


@app.route("/photos/upload", methods=["GET", "POST"])
def upload_photo():
    """Displays image upload form and handles submit"""

    form = ImageUploadForm()

    if form.validate_on_submit():
        try:
            image_file = form.image.data
            filename = secure_filename(image_file.filename)

            img = PillowImage.open(image_file)
            image_metadata = get_formatted_metadata(img)

            for key in image_metadata:
                print(key, ": ", image_metadata[key])

            image_file.seek(0)
            s3.upload_fileobj(
                image_file,
                bucket_name,
                filename
            )

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
            db.session.commit()

            flash("Image upload successful!", "success")
            return redirect("/photos")

        except IntegrityError as err:
            print("Exception", err)
            flash("Image name already taken.", "danger")

        except Exception as err:
            print("Exception", err)
            flash("Image upload failed!", "danger")

    return render_template('upload_form.html', form=form)


@app.get("/photos")
def display_photos():

    photos = Image.query.all()

    return render_template("all_photos.html", photos=photos, base_url=base_url)


@app.get("/photos/<photo_name>")
def display_photo(photo_name):

    photo = Image.query.get_or_404(photo_name)
    metadata = get_metadata_for_display(photo)

    return render_template("display_photo.html", photo=photo, base_url=base_url, metadata=metadata)


@app.get("/photos/<photo_name>/edit")
def edit_photo(photo_name):

    photo = Image.query.get_or_404(photo_name)

    return render_template('edit_photo.html', photo=photo, base_url=base_url)


@app.post("/photos/<photo_name>/edit")
def upload_edited_photo(photo_name):

    print(request.files)

    image_file = request.files["image"]

    s3.upload_fileobj(
        image_file,
        bucket_name,
        photo_name
    )

    return jsonify({
        "message": "Image saved"
    })
