from flask_wtf import FlaskForm
from wtforms import FileField
from wtforms.validators import DataRequired
from flask_wtf.file import FileAllowed


class ImageUploadForm(FlaskForm):
    """Form for uploading an image"""

    image = FileField('Image', validators=[
        DataRequired(),
        FileAllowed(['jpg', 'png', 'jpeg'], 'Images only!')
    ])
