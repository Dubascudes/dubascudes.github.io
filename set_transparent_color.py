from PIL import Image
import os
import sys

def set_transparent_pixels_to_color(image_path, color):
    """
    Sets all transparent pixels in a PNG image to a specified color.

    Args:
        image_path (str): Path to the input PNG file.
        color (tuple): The RGB color to set for transparent pixels (e.g., (255, 0, 0) for red).
    """
    try:
        image = Image.open(image_path).convert("RGBA")
        data = image.getdata()
        
        new_data = []
        for item in data:
            if item[3] == 0:  # Fully transparent pixel
                new_data.append((color[0], color[1], color[2], 255))  # Replace with specified color (fully opaque)
            else:
                new_data.append(item)
        
        image.putdata(new_data)
        
        # Generate new file name with color suffix
        base, ext = os.path.splitext(image_path)
        color_suffix = f"_opaque"
        new_file_path = f"{base}{color_suffix}.png"
        
        image.save(new_file_path)
        print(f"Saved: {new_file_path}")
    except Exception as e:
        print(f"Error processing {image_path}: {e}")

def process_images(image_paths, color):
    """
    Processes a list of image paths, setting transparent pixels to a specific color.

    Args:
        image_paths (list): List of paths to PNG files.
        color (tuple): The RGB color to set for transparent pixels.
    """
    for image_path in image_paths:
        if image_path.lower().endswith(".png"):
            set_transparent_pixels_to_color(image_path, color)
        else:
            print(f"Skipping {image_path}: Not a PNG file.")

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print("Usage: python script.py r g b path1.png [path2.png ...]")
        sys.exit(1)
    
    # Extract color from command-line arguments
    r, g, b = int(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3])
    color = (r, g, b)
    
    # Extract image paths from command-line arguments
    image_paths = sys.argv[4:]
    
    process_images(image_paths, color)
