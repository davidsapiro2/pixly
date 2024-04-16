from flask import Flask, render_template, redirect, flash
from forms import ImageUploadForm
import boto3
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
from PIL import Image
import piexif
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = "oh-so-secret"
app.config['UPLOAD_FOLDER'] = "./uploaded_photos"

load_dotenv()

app.config["SQLALCHEMY_DATABASE_URI"] = os.environ["DATABASE_URL"]
app.config['SQLALCHEMY_ECHO'] = False

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
            exif_dict = piexif.load(img.info['exif'])

            print("exif_dict", exif_dict)
            print("exif", img.info["exif"])
            print(img.filename)
            print(img.format)
            print(img.mode)
            print(img.size)

            s3.upload_fileobj(
                image_file,
                bucket_name,
                filename
            )

            flash("Image upload successful!")
            return redirect("/")

        except Exception:
            print("Exception", Exception)
            flash("Image upload failed!")

    return render_template('upload_form.html', form=form)
