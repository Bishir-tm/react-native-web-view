import os

def list_files_in_directory(directory_path, output_file):
    """
    Recursively lists all file names and their extensions in a given directory and its subdirectories,
    along with the directory tree structure, and stores the results in a text file.

    :param directory_path: Path to the directory to scan.
    :param output_file: Path to the output text file.
    """
    with open(output_file, "w") as file:
        for root, dirs, files in os.walk(directory_path):
            level = root.replace(directory_path, "").count(os.sep)
            indent = " " * 4 * level
            file.write(f"{indent}/{os.path.basename(root) or root}\n")
            sub_indent = " " * 4 * (level + 1)
            for f in files:
                file_name, file_extension = os.path.splitext(f)
                file.write(f"{sub_indent}{file_name}{file_extension}\n")

if __name__ == "__main__":
    # Replace 'your_directory_path_here' with the path of the folder you want to scan.
    directory_path = "./"
    output_file = "file_list.txt"

    if os.path.exists(directory_path) and os.path.isdir(directory_path):
        print(f"Listing files in directory: {directory_path} and saving to {output_file}\n")
        list_files_in_directory(directory_path, output_file)
        print("File listing saved successfully.")
    else:
        print("The provided path is not a valid directory.")
