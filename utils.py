import piexif
from PIL.ExifTags import TAGS
import datetime

def get_formatted_metadata(img):
    metadata = extract_metadata(img)
    formatted_metadata = format_metadata(metadata)
    return formatted_metadata

def extract_metadata(img):
    exif_dict = piexif.load(img.info['exif'])
    image_metadata = {}

    for key in exif_dict["Exif"]:
        image_metadata[TAGS[int(key)]] = exif_dict["Exif"][key]
    for key in exif_dict["0th"]:
        image_metadata[TAGS[int(key)]] = exif_dict["0th"][key]

    image_metadata["filename"] = img.filename
    image_metadata["format"] = img.format
    image_metadata["mode"] = img.mode
    image_metadata["size"] = img.size

    image_metadata["GPS"] = gps_data_parser(exif_dict["GPS"])

    return image_metadata

def format_metadata(metadata):

    return ({
        "gps": metadata.get("GPS"),
        "mode": metadata.get("mode"),
        "format": metadata.get("format"),
        "height": metadata.get("size")[0],
        "width": metadata.get("size")[1],
        "datetime": metadata.get("DateTimeOriginal"),
        "focal_length": metadata.get("FocalLength"),
        "shutterspeed": metadata.get("ShutterSpeedValue"),
        "aperture": metadata.get("ApertureValue"),
        "iso": metadata.get("ISOSpeedRatings"),
        "fnumber": metadata.get("FNumber"),
        "exposure_time": metadata.get("ExposureTime"),
        "lens_make": metadata.get("LensMake"),
        "lens_model": metadata.get("LensModel"),
        "device_make": metadata.get("Make"),
        "device_model": metadata.get("Model")
    })

def gps_data_parser(gps_data):
    return str(gps_data)
