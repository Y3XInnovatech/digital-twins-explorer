import os

def list_files(startpath):
    with open('directory_structure.txt', 'w') as f:
        for root, dirs, files in os.walk(startpath):
            level = root.replace(startpath, '').count(os.sep)
            indent = ' ' * 4 * (level)
            f.write(f"{indent}{os.path.basename(root)}/\n")
            for file in files:
                f.write(f"{indent}    {file}\n")

if __name__ == "__main__":
    list_files('.')
