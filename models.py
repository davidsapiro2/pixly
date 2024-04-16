"""SQLAlchemy models for Pixly"""

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Image(db.Model):
    """Image data"""

    __tablename__ = "images"

    filename = db.Column(
        db.Text,
        primary_key=True
    )

    gps = db.Column(
        db.Text,
    )

    mode = db.Column(
        db.Text,
    )

    format = db.Column(
        db.Text,
    )

    height = db.Column(
        db.Integer,
    )

    width = db.Column(
        db.Integer,
    )


    datetime = db.Column(
        db.DateTime
    )

    focal_length = db.Column(
        db.Text,
    )

    shutterspeed = db.Column(
        db.Text,
    )

    aperture = db.Column(
        db.Text,
    )

    iso = db.Column(
        db.Text,
    )

    fnumber = db.Column(
        db.Text,
    )

    exposure_time = db.Column(
        db.DateTime,
    )

    lens_make = db.Column(
        db.Text,
    )

    lens_model = db.Column(
        db.Text,
    )

    device_make = db.Column(
        db.Text,
    )

    device_model = db.Column(
        db.Text,
    )


def connect_db(app):
    """Connect this database to provided Flask app.

    You should call this in your Flask app.
    """

    app.app_context().push()
    db.app = app
    db.init_app(app)