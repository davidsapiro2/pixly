import piexif
from PIL.ExifTags import TAGS


def get_formatted_metadata(img):
    metadata = extract_metadata(img)
    formatted_metadata = format_metadata(metadata)
    clean_formatted_metadata = clean_metadata(formatted_metadata)
    return clean_formatted_metadata


def extract_metadata(img):

    image_metadata = {}

    if ("exif" in img.info):
        exif_dict = piexif.load(img.info['exif'])

        for key in exif_dict["Exif"]:
            image_metadata[TAGS[int(key)]] = exif_dict["Exif"][key]
        for key in exif_dict["0th"]:
            image_metadata[TAGS[int(key)]] = exif_dict["0th"][key]

        image_metadata["GPS"] = gps_data_parser(exif_dict["GPS"])

    image_metadata["format"] = img.format
    image_metadata["mode"] = img.mode
    image_metadata["size"] = img.size

    return image_metadata


def format_metadata(metadata):

    return ({
        "gps": metadata.get("GPS"),
        "mode": metadata.get("mode"),
        "format": metadata.get("format"),
        "height": metadata.get("size")[0],
        "width": metadata.get("size")[1],
        "datetime": metadata.get("DateTimeOriginal").decode("utf-8") if metadata.get("DateTimeOriginal") else None,
        "focal_length": metadata.get("FocalLength"),
        "shutterspeed": metadata.get("ShutterSpeedValue"),
        "aperture": metadata.get("ApertureValue"),
        "iso": metadata.get("ISOSpeedRatings"),
        "fnumber": metadata.get("FNumber"),
        "exposure_time": metadata.get("ExposureTime"),
        "lens_make": metadata.get("LensMake").decode("utf-8") if metadata.get("LensMake") else None,
        "lens_model": metadata.get("LensModel").decode("utf-8") if metadata.get("LensModel") else None,
        "device_make": metadata.get("Make").decode("utf-8") if metadata.get("Make") else None,
        "device_model": metadata.get("Model").decode("utf-8") if metadata.get("Model") else None
    })


def gps_data_parser(gps_data):
    return str(gps_data)


def clean_metadata(metadata):
    cleaned = {}
    for key, value in metadata.items():
        if isinstance(value, str):
            cleaned[key] = value.replace('\x00', '')
        else:
            cleaned[key] = value
    return cleaned

# https://pixly37.s3.us-east-2.amazonaws.com/Screenshot_from_2024-03-15_21-14-53.png
# https://pixly37.s3.us-east-2.amazonaws.com/Screenshot_from_2024-03-15_21-14-53.png