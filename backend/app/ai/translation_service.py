"""
Translation Service for ResilHealth-India.
Supports English, Tamil (தமிழ்), and Hindi (हिन्दी).
"""

from typing import Dict, Any

TRANSLATION_MAP = {
    "ta": {
        "Zero preventable stock-outs. Every health centre. Every state.": "தடுக்கக்கூடிய மருந்து தட்டுப்பாடு பூஜ்ஜியம். ஒவ்வொரு ஆரம்ப சுகாதார நிலையம். ஒவ்வொரு மாநிலமும்.",
        "Living Health Network": "வாழும் சுகாதார கட்டமைப்பு",
        "Stock-out Probability": "மருந்து தீரும் நிகழ்தகவு",
        "Days of Stock": "இருப்பு நாட்கள்",
        "Usable Stock": "பயன்படுத்தக்கூடிய இருப்பு",
        "Reserved": "முன்பதிவு செய்யப்பட்டது",
        "Incoming": "வரவிருக்கும் இருப்பு",
        "Effective Stock": "நடைமுறை இருப்பு",
        "Dispatch Voucher": "அனுப்பும் ரசீது",
        "Transfer Recommendations": "மருந்து இடமாற்றப் பரிந்துரைகள்",
        "Federated Privacy": "கூட்டாட்சி தனியுரிமை",
    },
    "hi": {
        "Zero preventable stock-outs. Every health centre. Every state.": "शून्य रोके जा सकने वाले स्टॉक-आउट। हर स्वास्थ्य केंद्र। हर राज्य।",
        "Living Health Network": "जीवंत स्वास्थ्य नेटवर्क",
        "Stock-out Probability": "स्टॉक समाप्त होने की संभावना",
        "Days of Stock": "स्टॉक के दिन",
        "Usable Stock": "उपयोग योग्य स्टॉक",
        "Reserved": "आरक्षित",
        "Incoming": "आने वाला स्टॉक",
        "Effective Stock": "प्रभावी स्टॉक",
        "Dispatch Voucher": "डिस्पैच वाउचर",
        "Transfer Recommendations": "हस्तांतरण सिफारिशें",
        "Federated Privacy": "फेडरेटेड गोपनीयता",
    }
}

def translate_text(text: str, target_lang: str = "en") -> Dict[str, Any]:
    if target_lang in TRANSLATION_MAP and text in TRANSLATION_MAP[target_lang]:
        return {
            "source_text": text,
            "target_language": target_lang,
            "translated_text": TRANSLATION_MAP[target_lang][text],
            "provider_status": "REAL_DICTIONARY"
        }
    return {
        "source_text": text,
        "target_language": target_lang,
        "translated_text": text,
        "provider_status": "PASSTHROUGH"
    }
