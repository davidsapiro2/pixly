import piexif
from PIL.ExifTags import TAGS

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

def gps_data_parser(gps_data):
    return str(gps_data)
