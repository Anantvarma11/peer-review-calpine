import sys

def extract_text(pdf_path):
    # Try pypdf
    try:
        from pypdf import PdfReader
        print("Attempting pypdf...")
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except ImportError:
        pass
    except Exception as e:
        print(f"pypdf error: {e}")

    # Try PyPDF2
    try:
        import PyPDF2
        print("Attempting PyPDF2...")
        with open(pdf_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            text = ""
            for i in range(len(reader.pages)):
                text += reader.pages[i].extract_text() + "\n"
            return text
    except ImportError:
        pass
    except Exception as e:
        print(f"PyPDF2 error: {e}")

    return "No suitable PDF library found (pypdf, PyPDF2)."

if __name__ == "__main__":
    path = "m:/AskCal Peer Dashboard - v2/Update for Peer Energy Dashboard.pdf"
    content = extract_text(path)
    try:
        with open("pdf_content.txt", "w", encoding="utf-8") as f:
            f.write(content)
        print("Successfully wrote content to pdf_content.txt")
    except Exception as e:
        print(f"Error writing file: {e}")
