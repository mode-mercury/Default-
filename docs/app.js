const form = document.getElementById('ocr-form');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const MORSE_CODE = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..',
    '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
    '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.'
};

const OGHAM_MAP = {
    '\u1681': ['B', 'Beith'], '\u1682': ['L', 'Luis'], '\u1683': ['F', 'Fearn'],
    '\u1684': ['S', 'Saille'], '\u1685': ['N', 'Nion'], '\u1686': ['H', 'Uath'],
    '\u1687': ['D', 'Dair'], '\u1688': ['T', 'Tinne'], '\u1689': ['C', 'Coll'],
    '\u168A': ['Q', 'Ceirt'], '\u168B': ['M', 'Muin'], '\u168C': ['G', 'Gort'],
    '\u168D': ['NG', 'nGeadal'], '\u168E': ['Z', 'Straif'], '\u168F': ['R', 'Ruis'],
    '\u1690': ['A', 'Ailm'], '\u1691': ['O', 'Onn'], '\u1692': ['U', 'Ur'],
    '\u1693': ['E', 'Eadhadh'], '\u1694': ['I', 'Idad']
};

const DESERET_MAP = {
    '\u10400': 'EE', '\u10401': 'EE', '\u10402': 'AH', '\u10403': 'AH',
    '\u10404': 'O',  '\u10405': 'O',  '\u10406': 'OO', '\u10407': 'OO'
};

const ALCHEMY_MAP = {
    '\u1F701': 'Air', '\u1F702': 'Fire', '\u1F703': 'Water', '\u1F704': 'Earth',
    '\u1F705': 'Arsenic', '\u1F706': 'Realgar', '\u1F707': 'Borax', '\u1F708': 'Sublimate'
};

const IPA_MAP = {
    '\u00F0': 'eth (voiced dental fricative)',
    '\u03B8': 'theta (voiceless dental fricative)',
    '\u0283': 'esh (voiceless postalveolar fricative)',
    '\u0292': 'ezh (voiced postalveolar fricative)',
    '\u014B': 'eng (velar nasal)',
    '\u00E6': 'ash (near-open front vowel)'
};

const HOBO_MAP = {
    '\u2691': 'Safe place',
    '\u2714': 'Work available'
};

const COP_TRANSLIT = {
    '\u2C80': 'a', '\u2C81': 'a',
    '\u2C82': 'b', '\u2C83': 'b',
    '\u2C84': 'g', '\u2C85': 'g',
    '\u2C86': 'd', '\u2C87': 'd',
    '\u2C88': 'e', '\u2C89': 'e',
    '\u2C8A': 's', '\u2C8B': 's',
    '\u2C8C': 'z', '\u2C8D': 'z',
    '\u2C8E': 'h', '\u2C8F': 'h',
    '\u2C90': 'th','\u2C91': 'th',
    '\u2C92': 'i', '\u2C93': 'i',
    '\u2C94': 'k', '\u2C95': 'k',
    '\u2C96': 'l', '\u2C97': 'l',
    '\u2C98': 'm', '\u2C99': 'm',
    '\u2C9A': 'n', '\u2C9B': 'n',
    '\u2C9C': 'x', '\u2C9D': 'x',
    '\u2C9E': 'o', '\u2C9F': 'o',
    '\u2CA0': 'p', '\u2CA1': 'p',
    '\u2CA2': 'r', '\u2CA3': 'r',
    '\u2CA4': 's', '\u2CA5': 's',
    '\u2CA6': 't', '\u2CA7': 't',
    '\u2CA8': 'u', '\u2CA9': 'u',
    '\u2CAA': 'f', '\u2CAB': 'f',
    '\u2CAC': 'kh','\u2CAD': 'kh',
    '\u2CAE': 'ps','\u2CAF': 'ps',
    '\u2CB0': 'o', '\u2CB1': 'o'
};

function getExtraInfo(ch) {
    if (MORSE_CODE[ch.toUpperCase()]) {
        return `Morse ${MORSE_CODE[ch.toUpperCase()]}`;
    }
    if (OGHAM_MAP[ch]) {
        const [latin, name] = OGHAM_MAP[ch];
        return `Ogham ${name} -> ${latin}`;
    }
    if (DESERET_MAP[ch]) {
        return `Deseret ${DESERET_MAP[ch]}`;
    }
    if (ALCHEMY_MAP[ch]) {
        return `Alchemy ${ALCHEMY_MAP[ch]}`;
    }
    if (IPA_MAP[ch]) {
        return `IPA ${IPA_MAP[ch]}`;
    }
    if (HOBO_MAP[ch]) {
        return `Hobo ${HOBO_MAP[ch]}`;
    }
    return null;
}

const CYRILLIC_TO_LATIN = {
    '\u0410':'A','\u0430':'a','\u0411':'B','\u0431':'b','\u0412':'V','\u0432':'v',
    '\u0413':'G','\u0433':'g','\u0414':'D','\u0434':'d','\u0415':'E','\u0435':'e',
    '\u0401':'Yo','\u0451':'yo','\u0416':'Zh','\u0436':'zh','\u0417':'Z','\u0437':'z',
    '\u0418':'I','\u0438':'i','\u0419':'Y','\u0439':'y','\u041A':'K','\u043A':'k',
    '\u041B':'L','\u043B':'l','\u041C':'M','\u043C':'m','\u041D':'N','\u043D':'n',
    '\u041E':'O','\u043E':'o','\u041F':'P','\u043F':'p','\u0420':'R','\u0440':'r',
    '\u0421':'S','\u0441':'s','\u0422':'T','\u0442':'t','\u0423':'U','\u0443':'u',
    '\u0424':'F','\u0444':'f','\u0425':'Kh','\u0445':'kh','\u0426':'Ts','\u0446':'ts',
    '\u0427':'Ch','\u0447':'ch','\u0428':'Sh','\u0448':'sh','\u0429':'Shch','\u0449':'shch',
    '\u042B':'Y','\u044B':'y','\u042D':'E','\u044D':'e','\u042E':'Yu','\u044E':'yu',
    '\u042F':'Ya','\u044F':'ya'
};

const GEORGIAN_TO_LATIN = {
    '\u10D0':'a','\u10D1':'b','\u10D2':'g','\u10D3':'d','\u10D4':'e','\u10D5':'v',
    '\u10D6':'z','\u10D7':'t','\u10D8':'i','\u10D9':'k','\u10DA':'l','\u10DB':'m',
    '\u10DC':'n','\u10DD':'o','\u10DE':'p','\u10DF':'zh','\u10E0':'r','\u10E1':'s',
    '\u10E2':'t','\u10E3':'u','\u10E4':'ph','\u10E5':'q','\u10E6':'gh','\u10E7':'sh',
    '\u10E8':'ch','\u10E9':'ts','\u10EA':'dz','\u10EB':'ts','\u10EC':'ch','\u10ED':'kh',
    '\u10EE':'j','\u10EF':'h','\u10F0':'e','\u10F1':'oe','\u10F2':'fi','\u10F3':'yn',
    '\u10F4':'el','\u10F5':'har','\u10F6':'hoe','\u10F7':'hie','\u10F8':'we',
    '\u10F9':'har','\u10FA':'hoe'
};

function romanize(text, lang) {
    if (!lang) return text;
    if (lang.startsWith('ru') || lang.startsWith('cyr')) {
        return text.split('').map(ch => CYRILLIC_TO_LATIN[ch] || ch).join('');
    }
    if (lang.startsWith('ka')) {
        return text.split('').map(ch => GEORGIAN_TO_LATIN[ch] || ch).join('');
    }
    if (lang.startsWith('cop')) {
        return text.split('').map(ch => COP_TRANSLIT[ch] || ch).join('');
    }
    return text;
}

const UNICODE_NAMES = {
    '!':'EXCLAMATION MARK', '"':'QUOTATION MARK', '#':'NUMBER SIGN', '$':'DOLLAR SIGN',
    '%':'PERCENT SIGN', '&':'AMPERSAND', '\'':'APOSTROPHE', '(':'LEFT PARENTHESIS',
    ')':'RIGHT PARENTHESIS', '*':'ASTERISK', '+':'PLUS SIGN', ',':'COMMA', '-':'HYPHEN-MINUS',
    '.':'FULL STOP', '/':'SOLIDUS', ':':'COLON', ';':'SEMICOLON', '<':'LESS-THAN SIGN',
    '=':'EQUALS SIGN', '>':'GREATER-THAN SIGN', '?':'QUESTION MARK', '@':'COMMERCIAL AT',
    '[':'LEFT SQUARE BRACKET', '\\':'REVERSE SOLIDUS', ']':'RIGHT SQUARE BRACKET',
    '^':'CIRCUMFLEX ACCENT', '_':'LOW LINE', '`':'GRAVE ACCENT', '{':'LEFT CURLY BRACKET',
    '|':'VERTICAL LINE', '}':'RIGHT CURLY BRACKET', '~':'TILDE'
};

function getCharName(ch) {
    if (/[A-Z]/.test(ch)) return `LATIN CAPITAL LETTER ${ch}`;
    if (/[a-z]/.test(ch)) return `LATIN SMALL LETTER ${ch.toUpperCase()}`;
    if (/[0-9]/.test(ch)) return `DIGIT ${ch}`;
    if (UNICODE_NAMES[ch]) return UNICODE_NAMES[ch];
    return 'UNKNOWN';
}

function getCharInfo(text) {
    const lines = [];
    for (const ch of text) {
        if (ch.trim() === '') continue;
        const name = getCharName(ch);
        const extra = getExtraInfo(ch);
        if (extra) {
            lines.push(`${ch} - ${name} (${extra})`);
        } else {
            lines.push(`${ch} - ${name}`);
        }
    }
    return lines;
}

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

function invertPixels() {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];
        data[i+1] = 255 - data[i+1];
        data[i+2] = 255 - data[i+2];
    }
    ctx.putImageData(imgData, 0, 0);
}

async function process(file, options) {
    const img = await loadImage(file);
    canvas.width = img.width;
    canvas.height = img.height;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(canvas.width/2, canvas.height/2);
    if (options.rotate) {
        ctx.rotate(options.rotate * Math.PI / 180);
    }
    ctx.scale(options.mirror ? -1 : 1, options.flipVertical ? -1 : 1);
    ctx.drawImage(img, -img.width/2, -img.height/2);
    ctx.restore();
    if (options.invert) invertPixels();

    const { data: { text } } = await Tesseract.recognize(canvas, options.lang || 'eng');
    document.getElementById('result').textContent = text;

    if (options.romanize) {
        const roman = romanize(text, options.lang || '');
        if (roman !== text) {
            document.getElementById('romanized-block').style.display = 'block';
            document.getElementById('romanized').textContent = roman;
        }
    }

    const info = getCharInfo(text);
    const ul = document.getElementById('char-info');
    ul.innerHTML = '';
    info.forEach(line => {
        const li = document.createElement('li');
        li.textContent = line;
        ul.appendChild(li);
    });

    document.getElementById('processed').src = canvas.toDataURL();
    document.getElementById('output').style.display = 'block';
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const file = document.getElementById('image').files[0];
    if (!file) return;
    const options = {
        invert: document.getElementById('invert').checked,
        mirror: document.getElementById('mirror').checked,
        flipVertical: document.getElementById('flip_vertical').checked,
        rotate: parseInt(document.getElementById('rotate').value || '0', 10),
        lang: document.getElementById('lang').value || 'eng',
        romanize: document.getElementById('romanize').checked
    };
    process(file, options);
});
