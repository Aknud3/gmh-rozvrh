const BASE_URL = "https://znamky.gmh.cz/Timetable/Public";
const CLASS_ID = (process.argv[2] || "PY").toUpperCase();

const sources = {
    permanent: `${BASE_URL}/Permanent/Class/${CLASS_ID}?ShowCaption=0&ShowFilter=1&TouchMode=1&showTerm=1`,
    actual: `${BASE_URL}/Actual/Class/${CLASS_ID}?ShowCaption=0&ShowFilter=1&TouchMode=1&showTerm=1`,
    next: `${BASE_URL}/Next/Class/${CLASS_ID}?showCaption=0&showFilter=1&showTerm=1`
};

const dayMap = {
    pondělí: "po",
    úterý: "út",
    středa: "st",
    čtvrtek: "čt",
    pátek: "pá"
};

function parseTooltipDetails(html) {
    const matches = html.matchAll(/"TooltipDetails":"((?:\\.|[^"\\])*)"/g);
    const items = [];

    for (const match of matches) {
        try {
            // TooltipDetails is a JSON object encoded as a JSON string.
            const tooltipJson = JSON.parse(`"${match[1]}"`);
            const detail = JSON.parse(tooltipJson);
            if (detail.type !== "atom" || !detail.subjecttext) continue;

            const dayMatch = String(detail.day || "").match(/^(\d{1,2})\.(\d{1,2})\.\d{4} \(([^)]+)\)/);
            const timeText = String(detail.time || "");
            const hourMatch = timeText.match(/^(\d+)/);
            const timeMatch = timeText.match(/\(([^)]+)\)/);
            if (!dayMatch || !hourMatch) continue;

            const [, day, month, fullDay] = dayMatch;
            const dayShort = dayMap[fullDay.toLowerCase()] || fullDay.slice(0, 2);
            items.push({
                subject: detail.subjecttext,
                date: `${dayShort} ${parseInt(day)}.${parseInt(month)}.`,
                hour: parseInt(hourMatch[1]),
                time: timeMatch?.[1] || "",
                teacher: detail.teacher || "-",
                room: detail.room || "-",
                group: detail.group || "-",
                theme: detail.theme || "",
                change: detail.changeinfo || ""
            });
        } catch (error) {
            throw new Error(`TooltipDetails decode failed: ${error.message}`);
        }
    }

    return items;
}

function validateItems(items, label) {
    const required = ["subject", "date", "hour", "time", "teacher", "room", "group", "theme", "change"];
    if (!Array.isArray(items)) throw new Error(`${label}: parser did not return an array`);
    for (const [index, item] of items.entries()) {
        for (const field of required) {
            if (!(field in item)) throw new Error(`${label}: item ${index} misses ${field}`);
        }
        if (!/^(po|út|st|čt|pá) \d{1,2}\.\d{1,2}\.$/.test(item.date)) {
            throw new Error(`${label}: invalid normalized date ${item.date}`);
        }
        // The app's timetable uses hour 0 for the first lesson slot.
        if (!Number.isInteger(item.hour) || item.hour < 0) {
            throw new Error(`${label}: invalid hour ${item.hour}`);
        }
    }
}

function validateOnboardingContract(data) {
    if (!data.actual || !Array.isArray(data.actual.items)) throw new Error("Missing actual.items");
    if (!data.next || !Array.isArray(data.next.items)) throw new Error("Missing next.items");
    const groups = new Set([...data.actual.items, ...data.next.items].map(item => (item.group || "-").trim()));
    if (groups.size === 0) throw new Error("Onboarding would see no groups");
    return groups;
}

async function fetchSource(label, url) {
    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await response.text();
    if (!response.ok) throw new Error(`${label}: HTTP ${response.status}`);
    return { html, items: parseTooltipDetails(html) };
}

const results = {};
for (const [label, url] of Object.entries(sources)) {
    results[label] = await fetchSource(label, url);
    validateItems(results[label].items, label);
    console.log(`${label}: HTTP 200, ${results[label].items.length} atomů`);
    if (results[label].items[0]) console.log("  sample:", results[label].items[0]);
}

const apiShape = {
    actual: { items: results.actual.items },
    next: { items: results.next.items }
};
const groups = validateOnboardingContract(apiShape);

console.log(`onboarding: OK, nalezené skupiny (${groups.size}): ${[...groups].join(", ")}`);
console.log("Výsledek: nový parser splňuje formát, který očekává frontend i onboarding.");
