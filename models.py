"""SQLAlchemy models for Pixly"""

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Image(db.Model):
    """Image data"""

    __tablename__ = "images"

    def __init__(self, filename, gps, mode, format, height, width, datetime, focal_length,
                 shutterspeed, aperture, iso, fnumber, exposure_time, lens_make, lens_model,
                 device_make, device_model):
        self.filename=str(filename)
        self.gps=str(gps)
        self.mode=str(mode)
        self.format=str(format)
        self.height=height
        self.width=width
        self.datetime=str(datetime)
        self.focal_length=str(focal_length)
        self.shutterspeed=str(shutterspeed)
        self.aperture=str(aperture)
        self.iso=str(iso)
        self.fnumber=str(fnumber)
        self.exposure_time=str(exposure_time)
        self.lens_make=str(lens_make)
        self.lens_model=str(lens_model)
        self.device_make=str(device_make)
        self.device_model=str(device_model)
        self.update_search_vector()

    def update_search_vector(self):
        self.search_vector = ' '.join(filter(None, [
            self.filename,
            self.gps,
            self.mode,
            self.format,
            self.datetime,
            self.focal_length,
            self.shutterspeed,
            self.aperture,
            self.iso,
            self.fnumber,
            self.exposure_time,
            self.lens_make,
            self.lens_model,
            self.device_make,
            self.device_model
        ]))

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
        db.Text
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
        db.Text,
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

    search_vector = db.Column(
        db.Text,
    )


def connect_db(app):
    """Connect this database to provided Flask app.

    You should call this in your Flask app.
    """

    app.app_context().push()
    db.app = app
    db.init_app(app)
