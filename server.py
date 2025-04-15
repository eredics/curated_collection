# filepath: /Users/pete5553/Desktop/curated_collection/server.py
import os
from flask import Flask, send_from_directory, abort
from werkzeug.utils import safe_join
from urllib.parse import unquote

app = Flask(__name__, static_folder=None) # Disable default static handler initially
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))

print(f"Serving files from: {PROJECT_ROOT}")

# Route for serving the main index.html and other root files (like CSS, JS)
@app.route('/')
@app.route('/<path:filename>')
def serve_root_files(filename='index.html'):
    # Security: Ensure the path is safe and within the project root
    try:
        safe_path = safe_join(PROJECT_ROOT, filename)
        if not os.path.exists(safe_path) or not os.path.isfile(safe_path):
             print(f"Root file not found or not a file: {safe_path}")
             abort(404)
        print(f"Serving root file: {safe_path}")
        return send_from_directory(PROJECT_ROOT, filename)
    except Exception as e:
        print(f"Error serving root file {filename}: {e}")
        abort(404)

# Specific route for images_scraped, handling potential decoding issues
@app.route('/images_scraped/<path:filename>')
def serve_scraped_images(filename):
    image_dir = os.path.join(PROJECT_ROOT, 'images_scraped')
    # Flask/Werkzeug usually handles basic % decoding, but we ensure it's decoded
    decoded_filename = unquote(filename)
    print(f"Attempting to serve image: {decoded_filename} from {image_dir}")

    # Security: Ensure the path is safe and within the image directory
    try:
        # Use safe_join to prevent path traversal
        safe_path = safe_join(image_dir, decoded_filename)

        # Check if the file exists *after* decoding
        if not os.path.exists(safe_path) or not os.path.isfile(safe_path):
            print(f"Image file not found or not a file: {safe_path}")
            # Try finding case-insensitively (macOS default is case-insensitive but good practice)
            found = False
            for f in os.listdir(image_dir):
                if f.lower() == decoded_filename.lower():
                    safe_path = safe_join(image_dir, f)
                    found = True
                    print(f"Found case-insensitively: {safe_path}")
                    break
            if not found:
                abort(404)

        print(f"Serving image file: {safe_path}")
        return send_from_directory(image_dir, os.path.basename(safe_path))
    except Exception as e:
        print(f"Error serving image {decoded_filename}: {e}")
        abort(404) # Return 404 on any error during file serving

if __name__ == '__main__':
    # Use 0.0.0.0 to make it accessible on your network if needed,
    # otherwise '127.0.0.1' restricts to your machine.
    # Port 8000 is common, change if needed.
    app.run(host='127.0.0.1', port=8000, debug=True)