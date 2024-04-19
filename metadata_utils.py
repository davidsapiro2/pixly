import piexif
from PIL.ExifTags import TAGS


def get_metadata_for_display(photo):
    """
    Prepares a dictionary of photo metadata for display

    Args:
        photo: An object representing the photo with metadata attributes

    Returns:
        dict: A dictionary containing human-readable metadata of the photo.
    """

    return {
        "Height": photo.height,
        "Width": photo.width,
        "Format": photo.format,
        "Mode": photo.mode,
        "Date taken": photo.datetime,
        "Camera Make": photo.device_make,
        "Camera Model": photo.device_model,
        "Lens Make": photo.lens_make,
        "Lens Model": photo.lens_model,
        "Shutter Speed": photo.shutterspeed,
        "Exposure Time": photo.exposure_time,
        "Focal Length": photo.focal_length,
        "Aperture": photo.aperture,
        "F Number": photo.fnumber,
        "ISO": photo.iso,
    }


def get_formatted_metadata(img):
    """
    Extract and format the metadata from a PIL Image object, then clean it for
    display.

    Args:
        img (PIL.Image): An image object from which metadata will be extracted.

    Returns:
        dict: A dictionary containing cleaned and formatted metadata.
    """

    metadata = extract_metadata(img)
    formatted_metadata = format_metadata(metadata)
    clean_formatted_metadata = clean_metadata(formatted_metadata)
    return clean_formatted_metadata


def extract_metadata(img):
    """
    Extract metadata from a PIL Image object using EXIF data.

    Args:
        img (PIL.Image): The image object from which to extract metadata.

    Returns:
        dict: A dictionary containing raw metadata extracted from the image.
    """

    image_metadata = {}

    if ("exif" in img.info):
        exif_dict = piexif.load(img.info['exif'])

        for key in exif_dict["Exif"]:
            image_metadata[TAGS[int(key)]] = exif_dict["Exif"][key]
        for key in exif_dict["0th"]:
            image_metadata[TAGS[int(key)]] = exif_dict["0th"][key]

        image_metadata["GPS"] = gps_data_parser(
            exif_dict["GPS"]) if exif_dict["GPS"] else None

    image_metadata["format"] = img.format
    image_metadata["mode"] = img.mode
    image_metadata["size"] = img.size

    return image_metadata


def format_metadata(metadata):
    """
    Format raw metadata into a more user-friendly dictionary.

    Args:
        metadata (dict): A dictionary containing raw metadata extracted from
        an image.

    Returns:
        dict: A dictionary with more readable and user-friendly keys and values.
    """

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
    """
    Parse GPS data from EXIF format to a readable decimal degrees format.

    Args:
        gps_data (tuple): GPS data in EXIF format.

    Returns:
        str: A string representing latitude and longitude in decimal degrees.
    """

    def _convert_to_degrees(coords):
        """Convert GPS coordinates in (numerator, denominator) format to
        decimal degrees."""
        degrees = coords[0][0] / coords[0][1]
        minutes = coords[1][0] / coords[1][1] / 60.0
        seconds = coords[2][0] / coords[2][1] / 3600.0
        return degrees + minutes + seconds

    latitude_direction = gps_data[1].decode('utf-8')
    longitude_direction = gps_data[3].decode('utf-8')

    latitude = _convert_to_degrees(gps_data[2])
    longitude = _convert_to_degrees(gps_data[4])

    # Apply direction
    if latitude_direction == 'S':
        latitude = -latitude
    if longitude_direction == 'W':
        longitude = -longitude

    return f"{latitude}, {longitude}"


def clean_metadata(metadata):
    """
    Clean metadata dictionary by removing null termination characters

    Args:
        metadata (dict): A dict of metadata that may contain null characters

    Returns:
        dict: A cleaned version of the metadata dictionary
    """

    cleaned = {}
    for key, value in metadata.items():
        if isinstance(value, str):
            cleaned[key] = value.replace('\x00', '')
        else:
            cleaned[key] = value
    return cleaned
