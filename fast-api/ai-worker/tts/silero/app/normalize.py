"""Turns LLM text into something Silero's Russian model can pronounce.

Silero v4_ru reads Cyrillic only: digits and Latin letters are silently dropped, so
"Quackie на Twitch в 2024" would come out as "на в". Numbers become Russian words and
Latin words are transliterated (a small dictionary first, then letter rules).
"""

import re

from num2words import num2words

# Words a streaming co-host says often, spelled the way Russian speakers pronounce them.
KNOWN_WORDS = {
    "quackie": "кваки",
    "inktide": "инктайд",
    "twitch": "твич",
    "youtube": "ютуб",
    "discord": "дискорд",
    "telegram": "телеграм",
    "stream": "стрим",
    "streamer": "стример",
    "chat": "чат",
    "ok": "окей",
    "okay": "окей",
    "hi": "хай",
    "hello": "хэллоу",
    "wow": "вау",
    "lol": "лол",
    "gg": "гэ гэ",
    "obs": "о бэ эс",
    "ai": "эй ай",
}

# Letter names for short all-caps acronyms (OBS, AI, GG).
LETTER_NAMES = {
    "a": "эй",
    "b": "би",
    "c": "си",
    "d": "ди",
    "e": "и",
    "f": "эф",
    "g": "джи",
    "h": "эйч",
    "i": "ай",
    "j": "джей",
    "k": "кей",
    "l": "эл",
    "m": "эм",
    "n": "эн",
    "o": "оу",
    "p": "пи",
    "q": "кью",
    "r": "ар",
    "s": "эс",
    "t": "ти",
    "u": "ю",
    "v": "ви",
    "w": "дабл ю",
    "x": "экс",
    "y": "уай",
    "z": "зед",
}

# Longest patterns first; applied left to right over a lowercased word.
DIGRAPHS = [
    ("tion", "шн"),
    ("sch", "ш"),
    ("you", "ю"),
    ("igh", "ай"),
    ("sh", "ш"),
    ("ch", "ч"),
    ("zh", "ж"),
    ("th", "т"),
    ("ph", "ф"),
    ("ck", "к"),
    ("qu", "кв"),
    ("kh", "х"),
    ("ts", "ц"),
    ("wh", "в"),
    ("oo", "у"),
    ("ee", "и"),
    ("ea", "и"),
    ("ou", "ау"),
    ("ai", "эй"),
    ("ay", "эй"),
    ("oi", "ой"),
    ("oy", "ой"),
    ("ow", "оу"),
    ("ya", "я"),
    ("yu", "ю"),
    ("yo", "ё"),
    ("ye", "е"),
]

LETTERS = {
    "a": "а",
    "b": "б",
    "c": "к",
    "d": "д",
    "e": "е",
    "f": "ф",
    "g": "г",
    "h": "х",
    "i": "и",
    "j": "дж",
    "k": "к",
    "l": "л",
    "m": "м",
    "n": "н",
    "o": "о",
    "p": "п",
    "q": "к",
    "r": "р",
    "s": "с",
    "t": "т",
    "u": "у",
    "v": "в",
    "w": "в",
    "x": "кс",
    "y": "и",
    "z": "з",
}

VOWELS = set("aeiouy")

LATIN_WORD = re.compile(r"[A-Za-z]+(?:'[A-Za-z]+)?")
NUMBER = re.compile(r"\d+(?:[.,]\d+)?")
# Emoji, markdown and other symbols Silero cannot voice; letters, digits and punctuation stay.
UNSPEAKABLE = re.compile(r"[^\w\s.,!?;:…\-—–'\"«»()%]", re.UNICODE)


def transliterate(word: str) -> str:
    lower = word.lower().replace("'", "")
    if lower in KNOWN_WORDS:
        return KNOWN_WORDS[lower]
    if word.isupper() and 1 < len(word) <= 4:
        return " ".join(LETTER_NAMES[ch] for ch in lower)

    # A final silent "e" after a consonant (game, live) is not pronounced.
    if len(lower) > 3 and lower.endswith("e") and lower[-2] not in VOWELS:
        lower = lower[:-1]
    if lower.endswith("ie"):
        lower = lower[:-2] + "i"

    out, i = [], 0
    while i < len(lower):
        for pattern, sound in DIGRAPHS:
            if lower.startswith(pattern, i):
                out.append(sound)
                i += len(pattern)
                break
        else:
            ch = lower[i]
            nxt = lower[i + 1] if i + 1 < len(lower) else ""
            if ch == "c" and nxt in ("e", "i", "y"):
                out.append("с")
            elif ch == "y" and i == 0 and nxt in VOWELS:
                out.append("й")
            else:
                out.append(LETTERS.get(ch, ""))
            i += 1
    return "".join(out)


def _number_to_words(match: re.Match) -> str:
    raw = match.group(0).replace(",", ".")
    try:
        value = float(raw) if "." in raw else int(raw)
        return num2words(value, lang="ru")
    except (ValueError, OverflowError, NotImplementedError):
        return raw


def normalize(text: str) -> str:
    text = UNSPEAKABLE.sub(" ", text)
    text = text.replace("%", " процентов")
    text = NUMBER.sub(_number_to_words, text)
    text = LATIN_WORD.sub(lambda m: transliterate(m.group(0)), text)
    return re.sub(r"\s+", " ", text).strip()
