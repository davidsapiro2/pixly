from flask import Flask, render_template, redirect, flash
from forms import ImageUploadForm
from werkzeug.utils import secure_filename
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = "oh-so-secret"
app.config['UPLOAD_FOLDER'] = "./uploaded_photos"


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
            image_file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

            flash("Image upload successful!")
            return redirect("/")

        except Exception:
            flash("Image upload failed!")

    return render_template('upload_form.html', form=form)
