function convertToTitleSnakeCase(phrase)
{
    if(!phrase.length)
        return phrase;

    phrase = phrase.replaceAll("_", " ");
    let words = phrase.split(" ");
    let titleCaseWords = [];
    for(let word of words)
        titleCaseWords.push(word[0].toUpperCase() + word.slice(1).toLowerCase());

    return titleCaseWords.join("_");
}

// gotten from https://stackoverflow.com/questions/9038625/detect-if-device-is-ios
const iOSPlatformList = new Set(["iPad Simulator", "iPhone Simulator", "iPod Simulator", "iPad", "iPhone", "iPod"]);
function isRunningIOS()
{
    return iOSPlatformList.has(navigator.platform) ||
        // iPad on iOS 13 detection
        (navigator.userAgent.includes("Mac") && "ontouchend" in document);
}

function getLocaleString(num)
{
    // since this is an internal function with an optional parameter, I am worried that this might cause weird behavior, as in toLocaleString(undefined) behaving differently from toLocaleString()
    // return num.toLocaleString(shouldIgnoreLocale ? "en-US" : undefined);

    return shouldIgnoreLocale ? num.toLocaleString("en-US") : num.toLocaleString();
}

