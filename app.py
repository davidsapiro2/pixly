from flask import Flask, render_template, redirect, flash
from forms import ImageUploadForm
from models import db, connect_db, Image
import boto3
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
from PIL import Image
import os
from utils import get_formatted_metadata

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
    aws_access_key_id= os.getenv("AWS_ACCESS_KEY"),
    aws_secret_access_key= os.getenv("AWS_SECRET_KEY"),
    region_name= os.getenv("AWS_REGION"),
)
bucket_name = os.getenv("AWS_BUCKET_NAME")

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
            img = Image.open(image_file.stream)

            image_metadata = get_formatted_metadata(img)

            for key in image_metadata:
                print(key, ": ", image_metadata[key])

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

            flash("Image upload successful!")
            return redirect("/")

        except Exception:
            print("Exception", Exception)
            flash("Image upload failed!")

    return render_template('upload_form.html', form=form)
