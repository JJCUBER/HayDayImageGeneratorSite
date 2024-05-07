function loadAllFromLocalStorage()
{
    const sItems = localStorage.getItem("items");
    if(sItems)
    {
        // converts each "object" back into an object of type Item (not sure if I really need to do this)
        let kvps = JSON.parse(sItems);
        for(let i in kvps)
            kvps[i][1] = Object.assign(new Item(), kvps[i][1]);
        items = new Map(kvps);
    }

    const sIncludeSettingsInItemList = (localStorage.getItem("includeSettingsInItemList") ?? "true") === "true"; // default to true
    shouldIncludeSettingsInItemList = sIncludeSettingsInItemList;
    includeSettingsInItemListCheckBox.prop("checked", sIncludeSettingsInItemList);

    const sCopyCurrentItemsFromItemList = (localStorage.getItem("copyCurrentItemsFromItemList") ?? "false") === "true"; // default to false
    shouldCopyCurrentItemsFromItemList = sCopyCurrentItemsFromItemList;
    copyCurrentItemsFromItemListCheckBox.prop("checked", sCopyCurrentItemsFromItemList);

    activeItemList = localStorage.getItem("activeItemList") ?? "Default";
    deleteItemListButton.prop("disabled", activeItemList === "Default");

    // The item and settings for the currently selected item list should already be "active" when loading the page (they were loaded when the user selected the respective item list last time, or if there is no item list yet, then what they have loaded/active is what is created as "Default").
    // I've decided to treat it kind of as transactions; when a new item list is selected, the active main items and settings are stored into the previously selected item list, then the new item list is loaded.  This makes the most sense since it avoids issues with things related to needing to only save items to localStorage in async functions.
    const sItemLists = localStorage.getItem("itemLists");
    if(sItemLists)
    {
        let kvps = JSON.parse(sItemLists);
        itemLists = new Map(kvps);
    }
    itemListDropdown.empty();
    for(let name of itemLists.keys())
    {
        const option = new Option(name);
        itemListDropdown.append(option);
        if(activeItemList === name)
            $(option).prop("selected", true);
    }
    if(!itemLists.has("Default"))
        createNewItemList("Default");
    // The input for creating an item list starts empty; if one of the item lists is named the empty string (which is allowed), then the button needs to start disabled.
    // createItemListButton.prop("disabled", itemLists.has(""));
    // This should instead use the actual value of the input field since this function can be called by import all while this field is populated with something other than ""
    createItemListButton.prop("disabled", itemLists.has(createItemListInput.val()));

    const sAbbreviationMapping = localStorage.getItem("abbreviationMapping");
    if(sAbbreviationMapping)
        abbreviationMapping = new Map(JSON.parse(sAbbreviationMapping));

    const sBottomText = localStorage.getItem("bottomText") ?? "Partials Accepted"; // just like the abbreviations, I give a "reasonable" default
    bottomTextSettingInput.val(sBottomText);
    // must use innerText to preserve newline; jquery .text() doesn't (.innerText is used instead of .text() in all bottom text-related code)
    // I could alternatively use .html(), but that would cause issues with how the user might want to format their message, such as <Partials Accepted>
    bottomText[0].innerText = sBottomText;

    // clientWidth found from https://stackoverflow.com/questions/1248081/how-to-get-the-browser-viewport-dimensions
    const sItemsPerRow = localStorage.getItem("itemsPerRow") ?? Math.min(Math.floor(document.documentElement.clientWidth / 110), 8); // default up to 8 (however much fits; the exact calculation for the width a cell takes up is 8 + ct*100 + (ct-1)*10  AKA  110*ct - 2, but I rounded it slightly)
    itemsPerRowSlider.val(sItemsPerRow);
    itemsPerRowLabel.text(sItemsPerRow);
    itemsPerRow = parseInt(sItemsPerRow); // must "type cast" since localstorage doesn't retain type

    textListSeparatorSelectedRadio = parseInt(localStorage.getItem("textListSeparatorSelectedRadio") ?? 0); // don't really need to do this, but it would be best to treat it as an integer/number
    const sTextListCustomSeparator = localStorage.getItem("textListCustomSeparator") ?? "";
    textListSeparatorCustomRadio.val(sTextListCustomSeparator);
    textListCustomSeparatorInput.val(sTextListCustomSeparator);

    const sTextListFormat = localStorage.getItem("textListFormat") ?? "{{quantity}} {{name}} ({{price}})"; // default format on right
    textListFormatInput.val(sTextListFormat);

    const sPriceCalculationItem = localStorage.getItem("priceCalculationItem") ?? "Diamond Ring"; // default to rings
    priceCalculationItemInput.val(sPriceCalculationItem);

    // TODO -- finish up "Selections category and add it here; might want to combine thing right below this into this"

    const sShowPriceInScreenshot = (localStorage.getItem("showPriceInScreenshot") ?? "true") === "true"; // default to true; localStorage only uses strings, so need to make sure to compare to "true" not true
    showPriceInScreenshotCheckBox.prop("checked", sShowPriceInScreenshot);
    screenshotPriceHolder.prop("hidden", !sShowPriceInScreenshot);
    showTotalInNormalModeCheckBox.prop("disabled", !sShowPriceInScreenshot);

    const sShowTotalInNormalMode = (localStorage.getItem("showTotalInNormalMode") ?? (sShowPriceInScreenshot ? "true" : "false")) === "true"; // default to true so long as show price in screenshot is also enabled; localStorage only uses strings, so need to make sure to compare to "true" not true
    shouldShowTotalInNormalMode = sShowTotalInNormalMode;
    showTotalInNormalModeCheckBox.prop("checked", sShowTotalInNormalMode);

    const sHidePriceOrMultiplier = (localStorage.getItem("hidePriceOrMultiplier") ?? "false") === "true"; // default to false
    shouldHidePriceOrMultiplier = sHidePriceOrMultiplier;
    hidePriceOrMultiplierCheckBox.prop("checked", sHidePriceOrMultiplier);

    const sDefaultQuantity = localStorage.getItem("defaultQuantity") ?? "1"; // default to 1; not parsing as int since I want to allow equations
    defaultQuantity = sDefaultQuantity;
    defaultQuantityInput.val(sDefaultQuantity);
    itemQuantityInput.val(sDefaultQuantity);

    const sDefaultPriceOrMultiplier = localStorage.getItem("defaultPriceOrMultiplier") ?? "5x"; // default to 5x
    defaultPriceOrMultiplier = sDefaultPriceOrMultiplier;
    defaultPriceOrMultiplierInput.val(sDefaultPriceOrMultiplier);
    itemPriceOrMultiplierInput.val(sDefaultPriceOrMultiplier);

    const sRefocusNameOnSubmit = (localStorage.getItem("refocusNameOnSubmit") ?? "true") === "true"; // default to true // TODO -- is this a good idea (default: true)?
    shouldRefocusNameOnSubmit = sRefocusNameOnSubmit;
    refocusNameOnSubmitCheckBox.prop("checked", sRefocusNameOnSubmit);

    const sFocusQuantityOnAutocomplete = (localStorage.getItem("focusQuantityOnAutocomplete") ?? "true") === "true"; // default to true // TODO -- is this a good idea (default: true)?
    shouldFocusQuantityOnAutocomplete = sFocusQuantityOnAutocomplete;
    focusQuantityOnAutocompleteCheckBox.prop("checked", sFocusQuantityOnAutocomplete);

    const sIgnoreLocale = (localStorage.getItem("ignoreLocale") ?? "false") === "true"; // default to false
    shouldIgnoreLocale = sIgnoreLocale;
    ignoreLocaleCheckBox.prop("checked", sIgnoreLocale);
}

function saveAllToLocalStorage()
{
    saveItemsToLocalStorage();

    localStorage.setItem("includeSettingsInItemList", shouldIncludeSettingsInItemList);
    localStorage.setItem("copyCurrentItemsFromItemList", shouldCopyCurrentItemsFromItemList);
    localStorage.setItem("activeItemList", activeItemList);
    localStorage.setItem("itemLists", JSON.stringify([...itemLists]));

    localStorage.setItem("abbreviationMapping", JSON.stringify([...abbreviationMapping]));
    localStorage.setItem("bottomText", bottomText[0].innerText); // must use innerText for newlines to be handled properly
    // localStorage.setItem("bottomText", bottomTextSettingInput.val()); // can just use the setting input's value instead, though maybe I should keep it consistent with the loadAll, due to the way I load it into the bottom text then into the setting
    localStorage.setItem("itemsPerRow", itemsPerRow);
    localStorage.setItem("textListSeparatorSelectedRadio", textListSeparatorSelectedRadio);
    localStorage.setItem("textListCustomSeparator", textListCustomSeparatorInput.val());
    localStorage.setItem("textListFormat", textListFormatInput.val());
    localStorage.setItem("priceCalculationItem", priceCalculationItemInput.val());

    // TODO -- finish up "Selections category and add it here; might want to combine thing right below this into this"

    localStorage.setItem("showPriceInScreenshot", showPriceInScreenshotCheckBox.prop("checked")); // TODO -- I should make my use of a separate variable vs using the checkbox directly consistent
    localStorage.setItem("showTotalInNormalMode", shouldShowTotalInNormalMode);

    localStorage.setItem("hidePriceOrMultiplier", shouldHidePriceOrMultiplier);

    localStorage.setItem("defaultQuantity", defaultQuantity);
    localStorage.setItem("defaultPriceOrMultiplier", defaultPriceOrMultiplier);

    localStorage.setItem("refocusNameOnSubmit", shouldRefocusNameOnSubmit);
    localStorage.setItem("focusQuantityOnAutocomplete", shouldFocusQuantityOnAutocomplete);
    localStorage.setItem("ignoreLocale", shouldIgnoreLocale);
}

function saveItemsToLocalStorage()
{
    localStorage.setItem("items", JSON.stringify([...items], (key, value) => Item.fieldsToOmitFromLocalStorage.has(key) ? undefined : value));
}

