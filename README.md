# OCR Utility

This repository contains a simple command line tool for performing OCR (Optical Character Recognition) on an image. The tool allows you to optionally transform the image (invert colors, mirror horizontally, flip vertically or rotate) before OCR. After recognizing the text, it prints each character together with its Unicode name. Optionally the text can be translated to another language using Google Translate.

## Requirements

- Python 3
- Tesseract OCR installed on your system (`sudo apt-get install tesseract-ocr` on Debian/Ubuntu)
- Python packages in `requirements.txt`

## Installation

```
pip install -r requirements.txt
```

## Usage

```
python ocr_app.py IMAGE_PATH [options]
```

Options:

- `--invert` – invert the image colors.
- `--mirror` – mirror (flip horizontally) the image.
- `--flip-vertical` – flip the image vertically.
- `--rotate {90,180,270}` – rotate the image by the given degrees.
- `--lang CODE` – language code used by Tesseract. Defaults to `eng`.
- `--translate-to CODE` – language code to translate the recognized text to.
- `--romanize` – transliterate the OCR result to Latin characters. Currently
  supports Cyrillic (e.g. Russian), Georgian and Coptic.

Characters from several specialist alphabets and symbol sets receive extra
context. When recognised, Ogham, Deseret, basic IPA letters, Alchemical signs,
a few hobo symbols and regular Latin letters or digits will display their
traditional names or the equivalent Morse code.

Example:

```
python ocr_app.py sample.png --invert --lang rus --translate-to en --romanize
```

This will invert `sample.png`, run OCR using the Russian language model, list all characters with their names, transliterate the text to Latin characters and translate the result into English.

## Web Interface

A simple Flask web app is provided for those who prefer a browser-based
interface. Start it with:

```bash
python web_app.py
```

Then open `http://localhost:5000` in your browser. Upload an image, choose the
transformations and languages, and view the OCR results directly on the page.
Check the *Romanize* box if you want the text transliterated to Latin characters.
The processed image preview will also be displayed alongside the extracted text.

## Additional Alphabets

The OCR output lists each recognised character together with its Unicode name
and, when possible, extra context:

- Latin letters and digits show their Morse code.
- Characters from the Ogham and Deseret alphabets display their traditional
  name and Latin equivalent.
- Several Alchemical and hobo signs include a short description.
- Basic IPA letters show a brief phonetic description.

## GitHub Pages

A simplified browser-only version of the OCR tool lives in the `docs/`
folder. It uses Tesseract.js to perform OCR directly in the browser so
no server is required.

To publish the site on GitHub Pages:

1. Push this repository to GitHub.
2. Open the project on GitHub and click **Settings**.
3. Select **Pages** from the sidebar.
4. Under **Build and deployment** choose the `docs/` folder on the
   `main` branch as the source.
5. Save. GitHub will display a URL that follows the pattern
   `https://<username>.github.io/<repo>/`.

After a minute or two the static OCR page will be live at that address.

## SpiritToken Prototype

This repository now includes an initial ERC-20 token contract located at `contracts/SpiritToken.sol` as a starting point for the spirituality-themed blockchain phase. The contract can be compiled and tested with Hardhat:

```bash
npx hardhat test
```

This will compile the contract and run a simple test that verifies the initial supply is assigned to the deployer.
