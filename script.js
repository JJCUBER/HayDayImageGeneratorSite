
/* -------- scripts/Utility.js -------- */
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


/* -------- scripts/Globals.js -------- */
let itemsPerRow = 8;
let textListSeparatorSelectedRadio = 0;

let itemsPerRowSlider, itemsPerRowLabel, itemNameInput, itemQuantityInput, itemPriceOrMultiplierInput, itemTable;
let bottomText, screenshotRegion, screenshotPriceHolder;
let settingsOverlay, abbreviationMappingTable, bottomTextSettingInput, textListSeparatorRadios, textListCustomSeparatorInput, textListSeparatorCustomRadio, textListFormatInput, priceCalculationItemInput, showPriceInScreenshotCheckBox, showTotalInNormalModeCheckBox;
let priceCalculationModeStateSpan;
let disableInPriceCalculationModeElems, disableOutsidePriceCalculationModeElems;
let equationVisibilityStateSpan, unselectedItemsVisibilityStateSpan;
let shouldHideUnselectedItems = false;
let totalSelectedPriceArea, totalSelectedPriceHolder, totalSelectedPriceMessageHolder, totalSelectedPriceEquationHolder;
let coinImageUrl;
let priceCalculationItem;
let priceCalculationModeSelectionInfo;
let changelogOverlay, failedCopyOverlay, contactOverlay;
let copyImageLoadingWheel;
let shouldShowTotalInNormalMode = false;

let fuzzyMatchesHolder;


let preparedItemNames;


let items = new Map();

let abbreviationMapping = new Map([
    ["tnt", "tnt barrel"],
    ["dyn", "dynamite"],
    ["wsugar", "white sugar"],
    ["bsugar", "brown sugar"],
    ["bpop", "buttered popcorn"],
    ["cpop", "cherry popsicle"],
    ["bmuff", "blackberry muffin"],
    ["rmuff", "raspberry muffin"],
    ["vice", "vanilla ice cream"],
    ["sice", "strawberry ice cream"],
    ["gbar", "gold bar"],
    ["sbar", "silver bar"],
    ["pbar", "platinum bar"],
    ["rcoal", "refined coal"],
    ["gcheese", "goat cheese"]
]);
let isActivelyCopyingImage = false;


/* -------- scripts/Init.js -------- */
$(document).ready(() =>
{
    itemsPerRowSlider = $("#itemsPerRowSlider");
    itemsPerRowLabel = $("#itemsPerRowLabel");
    itemNameInput = $("#itemNameInput");
    itemQuantityInput = $("#itemQuantityInput");
    itemPriceOrMultiplierInput = $("#itemPriceOrMultiplierInput");
    itemTable = $("#itemTable");

    bottomText = $("#bottomText");
    screenshotRegion = $("#screenshotRegion");
    screenshotPriceHolder = $("#screenshotPriceHolder");

    settingsOverlay = new Overlay("settingsOverlay", "showButton");

    abbreviationMappingTable = $("#abbreviationMappingTable");
    bottomTextSettingInput = $("#bottomTextSettingInput");
    textListSeparatorRadios = $("input[name='textListSeparatorGroup']");
    textListCustomSeparatorInput = $("#textListCustomSeparatorInput");
    textListSeparatorCustomRadio = $("#textListSeparatorCustomRadio");
    textListFormatInput = $("#textListFormatInput");
    priceCalculationItemInput = $("#priceCalculationItemInput");
    showPriceInScreenshotCheckBox = $("#showPriceInScreenshotCheckBox");
    showTotalInNormalModeCheckBox = $("#showTotalInNormalModeCheckBox");

    priceCalculationModeStateSpan = $("#priceCalculationModeStateSpan");

    disableInPriceCalculationModeElems = $(".disableInPriceCalculationMode");
    disableOutsidePriceCalculationModeElems = $(".disableOutsidePriceCalculationMode");

    equationVisibilityStateSpan = $("#equationVisibilityStateSpan");
    unselectedItemsVisibilityStateSpan = $("#unselectedItemsVisibilityStateSpan");

    totalSelectedPriceArea = $("#totalSelectedPriceArea");
    totalSelectedPriceHolder = $("#totalSelectedPriceHolder");
    totalSelectedPriceMessageHolder = $("#totalSelectedPriceMessageHolder");
    totalSelectedPriceEquationHolder = $("#totalSelectedPriceEquationHolder");

    priceCalculationModeSelectionInfo = $("#priceCalculationModeSelectionInfo");

    changelogOverlay = new Overlay("changelogOverlay", "showButton");

    failedCopyOverlay = new Overlay("failedCopyOverlay", "imageHolder");

    /* TODO -- should this be called contactUsOverlay instead? */
    contactOverlay = new Overlay("contactOverlay", "showButton");

    copyImageLoadingWheel = $("#copyImageLoadingWheel");

    fuzzyMatchesHolder = $("#fuzzyMatchesHolder");


    itemsPerRowSlider.on("input", (event) =>
    {
        itemsPerRow = parseInt(event.target.value); // must convert to integer/number (since I do + calculations with it and don't want it to concat like a string)
        itemsPerRowLabel.text(itemsPerRow);
        updateItemLayout();

        rescaleScreenshotRegion();
    });


    itemNameInput.on("focus", updateFuzzyMatches);
    itemNameInput.on("blur", () =>
    {
        fuzzyMatchesHolder.empty();
    });

    itemNameInput.on("keydown", (e) =>
    {
        // should use key to get the value representation of the input, allowing numpad numbers to show up like normal numbers ( https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key and https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code )
        if(e.key.length !== 1 || e.key < '0' || e.key > '9')
            return;
        let selection = e.key - '0';
        if(selection === 0)
            selection = 10;

        const buttons = fuzzyMatchesHolder.find("button");
        if(buttons.length < selection)
            return;

        buttons.eq(selection - 1).trigger("mousedown", {usedKeyboard: true});
        event.preventDefault();
    });
    itemNameInput.on("keyup", (e) =>
    {
        handleAddingItem(e);

        // this should be done AFTER handling adding the item, since we want this to show no results if enter was pressed and the name input got wiped
        updateFuzzyMatches();
    });
    itemQuantityInput.on("keyup", handleAddingItem);
    itemPriceOrMultiplierInput.on("keyup", handleAddingItem);
    $("#itemSubmitButton").on("click", (e) => handleAddingItem(e, true));
    $("#itemDeleteButton").on("click", (e) =>
    {
        // want to return early if there was no item name (otherwise, the item quantity input's value would stay at 0 because handleAddingItem() would return early without doing anything)
        if(!formatItemName(itemNameInput.val()).length)
            return;

        //items.delete();
        itemQuantityInput.val("0");
        handleAddingItem(e, true);
    });


    const coinImagePromise = getImageUrl("Coin")
        .then(imageUrl => coinImageUrl = imageUrl)
        .catch(e => console.log("Failed to get coin image url --", e));

    $("#copyImageToClipboardButton").on("click", copyImageToClipboard);

    // TODO -- all of this event stuff seems to be identical for both the settings and changelog popups (and probably for potential future ones as well); I should probably turn at least part of this into some function with parameters for the corresponding jquery objects/selectors (for show button, hide button, background, etc.)

    // TODO -- I might want to eventually move this css stuff to a class, then use classList to add/remove these classes from the respective elements?  https://developer.mozilla.org/en-US/docs/Web/API/Element/classList
    settingsOverlay.showButton.on("click", () =>
    {
        settingsOverlay.overlay.prop("hidden", false);
        // disables scrolling the main page and removes the scrollbar from the side while the settings button is focused ( https://stackoverflow.com/questions/9280258/prevent-body-scrolling-but-allow-overlay-scrolling )
        // have to set both due to how I'm hiding overflow-x via css (this might not actually be required; TODO -- see if the css file actually needs html and body to both have overflow set; it seems like both should be set to prevent running into issues though: https://stackoverflow.com/questions/41506456/why-body-overflow-not-working )
        $("html, body").css("overflow-y", "hidden");
        // prevents the screenshot region from shifting over to the right due to the scrollbar now missing ( https://stackoverflow.com/questions/1417934/how-to-prevent-scrollbar-from-repositioning-web-page and https://css-tricks.com/elegant-fix-jumping-scrollbar-issue/ and https://aykevl.nl/2014/09/fix-jumping-scrollbar )
        screenshotRegion.css("margin-right", "calc(100vw - 100%)");
    });
    settingsOverlay.hideButton.on("click", () =>
    {
        settingsOverlay.overlay.prop("hidden", true);
        $("html, body").css("overflow-y", "visible");
        screenshotRegion.css("margin-right", "unset");
    });
    settingsOverlay.background.on("click", () =>
    {
        settingsOverlay.hideButton.trigger("click");
    });



    loadAllFromLocalStorage();

    // want to keep this synchronous
    ensureItemsHaveMaxPriceSet();
    // I could make total price update only once at the end when in price calc mode, but I've decided to update it with every new price loaded in ensureItemsHaveMaxPriceSet(); this way, the user can see the price/errors update in real time (it's more responsive).
    /*
    .then(() => {
        if(getIsInPriceCalculationMode())
            updateTotalPrice();
    });
    */

    // want to update the layout after loading from local storage, but only after the coin image has loaded
    coinImagePromise.then(() =>
    {
        updateItemLayout();
    });



    // these must all be after local storage is loaded (since their initial values change depending on what the user's settings had saved)


    setUpAbbreviationMappingTable();


    // must use innerText to preserve newline; jquery .text() doesn't (.innerText is used instead of .text() in all bottom text-related code)
    // I could alternatively use .html(), but that would cause issues with how the user might want to format their message, such as <Partials Accepted>
    bottomTextSettingInput.val(bottomText[0].innerText);
    // on input for showing live modifications in the background (behind the settings popup)
    bottomTextSettingInput.on("input", event =>
    {
        bottomText[0].innerText = event.target.value;
    });
    // on change for when focus is lost to the input area, which "commits" the changes to local storage as well
    bottomTextSettingInput.on("change", event =>
    {
        bottomText[0].innerText = event.target.value;

        saveAllToLocalStorage();

        // I only do this on change and not on input because I fear that it would cause too much lag/input delay from processing this
        rescaleScreenshotRegion();
    });
    bottomText.on("click", () =>
    {
        settingsOverlay.showButton.trigger("click");
        // bottomTextSettingInput[0].scrollIntoView(false); // ensures that the textarea is visible/on screen (and puts it at the bottom so that it won't overlap with the x/close button)
        bottomTextSettingInput[0].scrollIntoView(); // ensures that the textarea is visible/on screen (and puts it at the top; for some reason, iOS doesn't do the normal behavior of shifting the page up when showing the keyboard after doing it this way)
        // TODO -- maybe this should be .focus() instead?
        bottomTextSettingInput.trigger("select");
    });


    // (only fires once the slider is released)
    itemsPerRowSlider.on("change", () =>
    {
        saveAllToLocalStorage();
    });


    // be careful; checked is a property, NOT an attribute (I originally was using .attr() -- https://api.jquery.com/attr/ )
    textListSeparatorRadios.eq(textListSeparatorSelectedRadio).prop("checked", true);
    textListCustomSeparatorInput[0].disabled = textListSeparatorRadios[textListSeparatorSelectedRadio].id !== "textListSeparatorCustomRadio";

    textListSeparatorRadios.each((i, elem) =>
    {
        $(elem).on("click", i, (event) =>
        {
            textListSeparatorSelectedRadio = event.data;

            // textListCustomSeparatorInput[0].disabled = event.target.id !== "textListSeparatorCustomRadio";
            textListCustomSeparatorInput[0].disabled = event.target !== textListSeparatorCustomRadio[0];

            saveAllToLocalStorage();
        });
    });

    textListCustomSeparatorInput.on("change", (event) =>
    {
        textListSeparatorCustomRadio.val(event.target.value);

        saveAllToLocalStorage();
    });

    textListFormatInput.on("change", () =>
    {
        saveAllToLocalStorage();
    });

    priceCalculationItemInput.on("change", async (event) =>
    {
        let itemNameFormatted = formatItemName(event.target.value);
        let itemUrl, itemMaxPrice;
        try
        {
            itemUrl = await getImageUrl(itemNameFormatted);
            itemMaxPrice = await getMaxPrice(itemNameFormatted);
        }
        catch
        {
            // default to diamond ring for invalid item names
            itemNameFormatted = "Diamond_Ring";

            itemUrl = await getImageUrl(itemNameFormatted);
            itemMaxPrice = await getMaxPrice(itemNameFormatted);
        }

        priceCalculationItem = new Item(itemNameFormatted, undefined, itemUrl, undefined, itemMaxPrice);

        // TODO -- it might be better to just always make sure price gets immediately updated tbh (although, enabling price calc mode or showing of the price in screenshot will run update total price themselves)
        if(getIsInPriceCalculationMode() || getIsPriceShownInScreenshot())
            updateTotalPrice();
        saveAllToLocalStorage();
    });
    // want to make it fire immediately the first time; I couldn't do this inside the load all function since this must be set after the load all and after the coin image url is fetched
    priceCalculationItemInput.trigger("change");


    // TODO -- should I be using change event instead of click event for checkboxes (along with any input element variants)?  Resources such as https://stackoverflow.com/questions/3442322/jquery-checkbox-event-handling make it sound like click doesn't work for certain things, but they do seem to (which is likely due to how old this so question is).
    showPriceInScreenshotCheckBox.on("click", () =>
    {
        let wasShowing = getIsPriceShownInScreenshot();
        screenshotPriceHolder.prop("hidden", wasShowing);

        showTotalInNormalModeCheckBox.prop("disabled", wasShowing);

        if(!wasShowing)
            updateTotalPrice();
        saveAllToLocalStorage();
    });

    showTotalInNormalModeCheckBox.on("click", () =>
    {
        shouldShowTotalInNormalMode = !shouldShowTotalInNormalMode;

        updateTotalPrice();
        saveAllToLocalStorage();
    });

    $("#copyAsTextListButton").on("click", copyAsTextListToClipboard);

    $("#clearAllButton").on("click", () =>
    {
        if(confirm("Are you sure?  This will clear the items currently added and can't be undone."))
        {
            items.clear();
            updateItemLayout();

            saveAllToLocalStorage();
        }
    });


    disableOutsidePriceCalculationModeElems.prop("disabled", true);

    $("#priceCalculationToggleButton").on("click", () =>
    {
        // MUST use currentTarget (or just reference priceCalculationToggleButton); event.target gets set to the span if it is the one actually clicked ( https://developer.mozilla.org/en-US/docs/Web/API/Event/currentTarget )
        // TODO -- maybe change all even.target's to even.currentTarget in my code?
        const toggleButton = event.currentTarget;
        const wasEnabled = getIsInPriceCalculationMode();

        // make relevant buttons enabled/disabled
        disableInPriceCalculationModeElems.prop("disabled", !wasEnabled);
        disableOutsidePriceCalculationModeElems.prop("disabled", wasEnabled);

        // make relevant elements hidden/visible
        // TODO - maybe make this a class/two classes like how I did enabled/disabled buttons?  However, there aren't really enough elements to warrant that at the moment (though it could help express intent).
        totalSelectedPriceArea.prop("hidden", wasEnabled);
        priceCalculationModeSelectionInfo.prop("hidden", wasEnabled);

        if(wasEnabled)
        {
            // disable it

            priceCalculationModeStateSpan.text("Enable"); // says the "opposite," since that's what it will change the state to on click
            toggleButton.classList.remove("selected");
        }
        else
        {
            // enable it

            priceCalculationModeStateSpan.text("Disable"); // says the "opposite," since that's what it will change the state to on click
            toggleButton.classList.add("selected");
        }

        // restore previous/remove all selections/custom adornments (done by refreshing the layout)
        updateItemLayout();
    });

    $("#selectAllButton").on("click", () =>
    {
        const cells = $("#itemTable td");
        setSelectedStateAll(items.values(), cells, true);

        updateTotalPrice();

        // need to update what items are and aren't visible now that all items have been selected (even previously hidden ones)
        if(shouldHideUnselectedItems)
            updateItemLayout();
    });

    $("#clearSelectionButton").on("click", () =>
    {
        const cells = $("#itemTable td");
        setSelectedStateAll(items.values(), cells, false);

        updateTotalPrice();

        // need to update what items are and aren't visible now that all items have been deselected (even previously visible ones)
        if(shouldHideUnselectedItems)
            updateItemLayout();
    });

    $("#subtractSelectedQuantitiesButton").on("click", () =>
    {
        for(let item of items.values())
        {
            if(!item.isSelected)
                continue;

            item.quantity -= item.customQuantity ?? item.quantity;

            item.customQuantity = undefined;

            // it should be fine to remove elements from a map while iterating over it according to https://stackoverflow.com/questions/35940216/es6-is-it-dangerous-to-delete-elements-from-set-map-during-set-map-iteration
            if(item.quantity <= 0)
                items.delete(item.name);

            // TODO - Should items that have a >0 quantity left stay selected?  On the one hand, one might consider custom quantities to be all you selected; on the other hand, one might consider custom quantities to be just part of the whole currently being worked on in this moment (which means that after subtracting said amount, they still want to work with the rest of said item's quantity and/or keep it selected).
            // If I decide to deselect all, I should put an else to the if above which does item.isSelected = false;
        }

        updateItemLayout();

        saveAllToLocalStorage();
    });

    $("#deleteSelectedButton").on("click", () =>
    {
        for(let item of items.values())
        {
            if(item.isSelected)
                items.delete(item.name);
        }

        updateItemLayout();

        saveAllToLocalStorage();
    });

    $("#resetCustomValuesButton").on("click", () =>
    {
        for(let item of items.values())
        {
            item.customQuantity = undefined;
            item.customPriceOrMultiplier = undefined;
        }

        updateItemLayout();
    });

    $("#equationVisibilityToggleButton").on("click", () =>
    {
        // TODO - might want to use something like this for the price calculation toggle, since it can be tied to the total price div area
        const wasHidden = totalSelectedPriceEquationHolder.is("[hidden]");

        equationVisibilityStateSpan.text(wasHidden ? "Hide" : "Show");
        totalSelectedPriceEquationHolder.prop("hidden", !wasHidden);

        const toggleButton = event.currentTarget;
        if(wasHidden)
            toggleButton.classList.add("selected");
        else
            toggleButton.classList.remove("selected");
    });

    $("#unselectedItemsVisibilityToggleButton").on("click", () =>
    {
        const wasHidden = shouldHideUnselectedItems;
        unselectedItemsVisibilityStateSpan.text(wasHidden ? "Hide" : "Show");

        const toggleButton = event.currentTarget;
        if(wasHidden)
            toggleButton.classList.remove("selected");
        else
            toggleButton.classList.add("selected");

        shouldHideUnselectedItems = !shouldHideUnselectedItems;
        updateItemLayout();
    });




    setUpChangelog();

    changelogOverlay.showButton.on("click", () =>
    {
        changelogOverlay.overlay.prop("hidden", false);
        // disables scrolling the main page and removes the scrollbar from the side while the settings button is focused ( https://stackoverflow.com/questions/9280258/prevent-body-scrolling-but-allow-overlay-scrolling )
        $("html, body").css("overflow-y", "hidden");
        // prevents the screenshot region from shifting over to the right due to the scrollbar now missing ( https://stackoverflow.com/questions/1417934/how-to-prevent-scrollbar-from-repositioning-web-page and https://css-tricks.com/elegant-fix-jumping-scrollbar-issue/ and https://aykevl.nl/2014/09/fix-jumping-scrollbar )
        screenshotRegion.css("margin-right", "calc(100vw - 100%)");
    });
    changelogOverlay.hideButton.on("click", () =>
    {
        changelogOverlay.overlay.prop("hidden", true);
        $("html, body").css("overflow-y", "visible");
        screenshotRegion.css("margin-right", "unset");
    });
    changelogOverlay.background.on("click", () =>
    {
        changelogOverlay.hideButton.trigger("click");
    });

    handleVersionChange();



    failedCopyOverlay.hideButton.on("click", () =>
    {
        failedCopyOverlay.overlay.prop("hidden", true);
        $("html, body").css("overflow-y", "visible");
        screenshotRegion.css("margin-right", "unset");
    });
    failedCopyOverlay.background.on("click", () =>
    {
        failedCopyOverlay.hideButton.trigger("click");
    });



    contactOverlay.showButton.on("click", () =>
    {
        contactOverlay.overlay.prop("hidden", false);
        // disables scrolling the main page and removes the scrollbar from the side while the settings button is focused ( https://stackoverflow.com/questions/9280258/prevent-body-scrolling-but-allow-overlay-scrolling )
        $("html, body").css("overflow-y", "hidden");
        // prevents the screenshot region from shifting over to the right due to the scrollbar now missing ( https://stackoverflow.com/questions/1417934/how-to-prevent-scrollbar-from-repositioning-web-page and https://css-tricks.com/elegant-fix-jumping-scrollbar-issue/ and https://aykevl.nl/2014/09/fix-jumping-scrollbar )
        screenshotRegion.css("margin-right", "calc(100vw - 100%)");
    });
    contactOverlay.hideButton.on("click", () =>
    {
        contactOverlay.overlay.prop("hidden", true);
        $("html, body").css("overflow-y", "visible");
        screenshotRegion.css("margin-right", "unset");
    });
    contactOverlay.background.on("click", () =>
    {
        contactOverlay.hideButton.trigger("click");
    });



    prepareAllItemNames().then(prepared =>
    {
        preparedItemNames = prepared;
    });



    // prevents zooming in on input/textarea focus in iOS
    // TODO -- maybe make this some class and/or css media query-related thing?
    if(isRunningIOS())
        $("input, textarea").css("font-size", "16px");


    // rescale screenshot region whenever window/page is resized (also invokes it for the first time immediately to ensure it starts scaled properly)
    $(window).on("resize", rescaleScreenshotRegion);
    rescaleScreenshotRegion();
});


/* -------- scripts/Overlay.js -------- */
// TODO -- maybe make show and hide functions?
class Overlay
{
    // TODO -- extraIds is a bad name; it should be something pertaining to extra overlay elements (showButton, imageHolder, etc.)
    // TODO - I might want to make a list of dictionary mappings from extra overlay element name to function for settings up (since I have repeated code pertaining to showButtons)
    constructor(overlayId, ...extraIds)
    {
        this.overlay = $(`#${overlayId}`);

        this.background = this.overlay.find(".overlayBackground");
        this.box = this.overlay.find(".overlayBox");
        this.hideButton = this.overlay.find(".overlayHideButton");
        this.inner = this.overlay.find(".overlayInner");

        // add the extra ids as valid this. entries
        for(let extraId of extraIds)
        {
            if(!extraId.length)
                continue;

            const extraIdFirstUpper = extraId[0].toUpperCase() + extraId.slice(1);
            this[extraId] = $(`#${overlayId}${extraIdFirstUpper}`);
        }
    }
}


/* -------- scripts/Item.js -------- */
// There are more operators than the ones here technically supported by math.js, but I feel like these are all the "reasonable" ones to support for the automatic prepending of the old quantity/custom quantity ( https://mathjs.org/docs/expressions/syntax.html )
// TODO -- I could theoretically make this a set, but that's probably not a good idea since the "keys" have differing lengths and I'm just looking for whether a given equation string starts with one of these keys
const operators = ['+', '-', '*', '/', '^', '%', "mod", '&', '|', "<<", ">>>", ">>"]; // >>> should be before >> to ensure the full operator gets removed then readded later (if >> was first, ">>> 5" would only remove the first 2 '>' leaving "> 5")
function handleAddingItem(e, usedSubmitButton = false)
{
    // only want the name box to have the invalid red border until the user starts typing again (tabbing into this textbox also cancels it; unfortunately, this gets removed almost immediately if the user starts typing right after pressing enter, since it takes a bit of time for the fetch to occur and for the invalid class to be added, if needed)
    if(itemNameInput.hasClass("invalid"))
        itemNameInput.removeClass("invalid");


    // Don't want to accept changes while trying to copy the image
    // TODO -- I don't handle actively copying image yet for anything related to price calculation mode; maybe I should do that?
    if(isActivelyCopyingImage)
        return;

    // TODO -- might want to be using e.key instead
    if(!usedSubmitButton && e.code !== "Enter")
        return;

    const itemNameFormatted = formatItemName(itemNameInput.val());
    if(!itemNameFormatted.length)
        return;

    let itemQuantity, prependedQuantityOperator = "";
    let itemQuantityEquation = itemQuantityInput.val().trim();
    // only want to separate starting operator if the item already exists (if the item doesn't exist, the whole quantity should be evaluated as one equation)
    if(items.has(itemNameFormatted))
    {
        for(let operator of operators)
        {
            if(!itemQuantityEquation.startsWith(operator))
                continue;

            prependedQuantityOperator = operator;
            itemQuantityEquation = itemQuantityEquation.substr(prependedQuantityOperator.length);
            break;
        }
    }

    try
    {
        // rest of equation is calculated beforehand so that addItem() gets an actual value
        itemQuantity = itemQuantityEquation.length ? math.evaluate(itemQuantityEquation) : 0;
    }
    catch(e)
    {
        console.log("Unable to evaluate quantity --", e);
        return;
    }

    addItem(itemNameFormatted, itemQuantity, itemPriceOrMultiplierInput.val(), prependedQuantityOperator)
        .then(() => updateItemLayout())
        .catch(e =>
        {
            console.log("Failed to add item and update layout --", e);

            itemNameInput.addClass("invalid");
        });

    itemNameInput.val("");
    itemQuantityInput.val(1);
    itemPriceOrMultiplierInput.val("5x");
}


class Item
{
    static fieldsToOmitFromLocalStorage = new Set(["customQuantity", "customPriceOrMultiplier", "isSelected"]);
    constructor(name, quantity, url, priceOrMultiplier, maxPrice)
    {
        this.name = name;
        this.quantity = quantity;
        this.url = url;
        this.priceOrMultiplier = priceOrMultiplier;
        this.maxPrice = maxPrice;

        // these should not persist across sessions (I also omit them from the JSON.stringify)
        this.customQuantity = undefined;
        this.customPriceOrMultiplier = undefined;
        this.isSelected = false;
    }

    getHumanReadableName()
    {
        return this.name.replaceAll("_", " ");
    }

    // returns [totalPrice, equation, error, warning]
    calculateTotalPrice()
    {
        let quantity = this.customQuantity ?? this.quantity,
            priceOrMultiplier = this.customPriceOrMultiplier ?? this.priceOrMultiplier,
            maxPrice = this.maxPrice;

        if(!maxPrice)
            return [NaN, "NaN", `${this.getHumanReadableName()} doesn't have a valid maximum price (${maxPrice}).`];


        priceOrMultiplier = priceOrMultiplier.trim();

        let price, mult;
        let warning;
        if(!priceOrMultiplier.length)
        {
            mult = "1";
            warning = `The price/multiplier for ${this.getHumanReadableName()} was empty, so it was defaulted to 1x.` ;
        }
        else if(priceOrMultiplier.endsWith('x'))
            mult = priceOrMultiplier.slice(0, -1);
        else if(priceOrMultiplier.endsWith('k'))
            price = `(${priceOrMultiplier.slice(0, -1)})*10^3`;
        else if(priceOrMultiplier.endsWith('m'))
            price = `(${priceOrMultiplier.slice(0, -1)})*10^6`;
        else
            price = priceOrMultiplier;

        if(mult)
            price = `${maxPrice}*(${mult})`;
        // I'm doing this so that it can be shown to the user in full
        price = `${quantity}*(${price})`;

        try
        {
            return [math.evaluate(price), price, undefined, warning];
        }
        catch(e)
        {
            console.log(e);
            // I believe that it would only ever be an issue with the price/mult?
            // return [NaN, price, `${this.getHumanReadableName()} has some invalid value (quantity: ${quantity}, price/multiplier: ${priceOrMultiplier}, max price: ${maxPrice} -- equation: ${price}).`, warning];
            return [NaN, price, `${this.getHumanReadableName()} has an invalid price/multiplier (price/multiplier: ${priceOrMultiplier} -- equation: ${price}).`, warning];
        }
    }
}


function addItem(itemNameFormatted, itemQuantity, itemPriceOrMultiplier, prependedQuantityOperator = "")
{
    const isInPriceCalculationMode = getIsInPriceCalculationMode();

    // the itemQuantity is already completely calculated, but we need to ensure that it isn't floating-point
    if(!prependedQuantityOperator)
        itemQuantity = Math.floor(itemQuantity);

    if(items.has(itemNameFormatted))
    {
        const currItem = items.get(itemNameFormatted);

        // modifies the custom fields instead when in price calculation mode
        if(isInPriceCalculationMode)
        {
            if(prependedQuantityOperator.length)
                itemQuantity = Math.floor(math.evaluate(`${currItem.customQuantity ?? currItem.quantity} ${prependedQuantityOperator} ${itemQuantity}`));
            // only stores custom if it differs; custom quantity set to <=0 defaults back to normal quantity, and custom price/mult gets wiped if its field becomes empty (otherwise the user might try to wipe it out, only to find out that it makes the mult default to 1x)
            currItem.customQuantity = (itemQuantity > 0 && itemQuantity !== currItem.quantity) ? itemQuantity : undefined;
            currItem.customPriceOrMultiplier = (itemPriceOrMultiplier.trim().length && itemPriceOrMultiplier !== currItem.priceOrMultiplier) ? itemPriceOrMultiplier : undefined;

            // makes sure that the item just modified is selected so that the custom value is visible to the user (if the user modified the value, they likely wanted it to be selected); this is to help with the fact that clicking on a selected item's quantity/price will deselect it
            currItem.isSelected = true;

            return Promise.resolve();
        }

        if(prependedQuantityOperator.length)
            itemQuantity = Math.floor(math.evaluate(`${currItem.quantity} ${prependedQuantityOperator} ${itemQuantity}`));

        if(itemQuantity > 0)
        {
            const prevQuantity = currItem.quantity;
            currItem.quantity = itemQuantity;
            currItem.priceOrMultiplier = itemPriceOrMultiplier;

            // need to wipe out custom values if they now match the new quantity/prices
            if(currItem.customQuantity === currItem.quantity || (currItem.customQuantity > currItem.quantity && currItem.customQuantity < prevQuantity)) // after updating an item's actual quantity, custom quantities above it should reset/"snap" back to the new quantity (unless it was already above it; custom quantity won't ever equal previous quantity, since it would have just gotten reset to undefined)
                currItem.customQuantity = undefined;
            if(currItem.customPriceOrMultiplier === currItem.priceOrMultiplier)
                currItem.customPriceOrMultiplier = undefined;
        }
        else
            items.delete(itemNameFormatted);

        saveAllToLocalStorage();

        return Promise.resolve();
    }

    // don't want to add new items in this mode
    if(isInPriceCalculationMode)
        return Promise.resolve();

    if(itemQuantity <= 0)
        return Promise.resolve();

    return getImageUrl(itemNameFormatted)
        .then(async imageUrl =>
        {
            console.log(imageUrl);

            const maxPrice = await getMaxPrice(itemNameFormatted);

            items.set(itemNameFormatted, new Item(itemNameFormatted, itemQuantity, imageUrl, itemPriceOrMultiplier, maxPrice));

            saveAllToLocalStorage();
        });
}


function formatItemName(itemName)
{
    const itemNameTrimmed = itemName.trim();
    if(!itemNameTrimmed.length)
        return itemNameTrimmed;

    const unabbreviatedItemName = handleAbbreviations(itemNameTrimmed);
    const itemNameTitleSnakeCase = convertToTitleSnakeCase(unabbreviatedItemName);
    const itemNameFormatted = handleSpecialNames(itemNameTitleSnakeCase);

    return itemNameFormatted;
}

function handleAbbreviations(itemName)
{
    return abbreviationMapping.get(itemName.toLowerCase()) ?? itemName;
}

// Items with "abnormal" casing are abbreviations and items with the word "and" in them (I could just replace all and's with And, but that might not be very future-proof or have a weird edge-case)
const specialNameMapping = new Map([
    ["Tnt_Barrel", "TNT_Barrel"],
    ["Blt_Salad", "BLT_Salad"],
    ["Bacon_And_Eggs", "Bacon_and_Eggs"],
    ["Fish_And_Chips", "Fish_and_Chips"],
    ["Peanut_Butter_And_Jelly_Sandwich", "Peanut_Butter_and_Jelly_Sandwich"],
    ["Frutti_Di_Mare_Pizza", "Frutti_di_Mare_Pizza"]
]);
function handleSpecialNames(itemName)
{
    return specialNameMapping.get(itemName) ?? itemName;
}

function getImageUrl(itemNameTitleSnakeCase)
{
    // https://www.mediawiki.org/wiki/API:Imageinfo
    // scaled down images don't work cross-site (it will work locally, but not on the hosted site)
    return fetch(`https://hayday.fandom.com/api.php?action=query&prop=imageinfo&iiprop=url&titles=File:${itemNameTitleSnakeCase}.png&format=json&origin=*`)
        .then(response => response.json())
        .then(data =>
        {
            // console.log(data);
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
            // for some reason, this works fine but the resultant wikia static image url yields a 404 from github pages ONLY when scaled down
            // return pages[pageId].imageinfo[0].thumburl;
            //return pages[pageId].imageinfo[0].thumburl.split("\/revision\/latest\/scale-to-width-down")[0];
            return pages[pageId].imageinfo[0].url.split("\/revision\/")[0]; // or split on "\/revision\/latest", but I'm worried that something might change at some point
        });
}

let previousSelection;
function updateItemLayout()
{
    itemTable.empty();

    if(!items.size)
        return;


    const shouldShowSelection = getIsInPriceCalculationMode();
    previousSelection = undefined;

    let itemsUnsorted = [...items.values()];
    // filter out unselected if the user wants them hidden
    if(shouldShowSelection && shouldHideUnselectedItems)
    {
        itemsUnsorted = itemsUnsorted.filter(item => item.isSelected);

        // nothing to show (since all of the items got filtered out), so we are done (also don't need to worry about updating the total price, since it always gets updated after clicking on any item's cell)
        if(!itemsUnsorted.length)
            return;
    }
    const itemsSortedDescending = itemsUnsorted.sort((item1, item2) => item2.quantity - item1.quantity);

    const itemCt = itemsSortedDescending.length;
    let rowCt = Math.ceil(itemCt / itemsPerRow);

    let i = 0;
    while(rowCt--)
    {
        const tableRow = document.createElement("tr");
        for(let j = 0; i < itemCt && j < itemsPerRow; i++, j++)
        {
            const currItem = itemsSortedDescending[i];
            const tableCell = document.createElement("td");
            tableCell.classList.add("itemCell");

            if(shouldShowSelection && currItem.isSelected)
                tableCell.classList.add("selected");

            // must be mouseup to execute before the on click events for image, quantity, and label (since they must select the text after it has been overridden by this)
            $(tableCell).on("mouseup", {index: i, item: currItem}, (event) =>
            {
                const item = event.data.item;
                itemNameInput.val(item.getHumanReadableName());
                itemQuantityInput.val(shouldShowSelection ? (item.customQuantity ?? item.quantity) : item.quantity);
                itemPriceOrMultiplierInput.val(shouldShowSelection ? (item.customPriceOrMultiplier ?? item.priceOrMultiplier) : item.priceOrMultiplier);

                if(!shouldShowSelection)
                    return;


                const index = event.data.index;
                const [first, last] = [index, previousSelection ?? index].sort((n1, n2) => n1 - n2);
                if(event.shiftKey) // range additive
                {
                    $("#itemTable td").slice(first, last + 1)
                        .each((k, elem) =>
                        {
                            const currItem = itemsSortedDescending[first + k];
                            setSelectedState(currItem, elem, true);
                        });
                }
                else if(event.altKey) // range subtractive; must use if else if... to make sure previousSelection always gets set
                {
                    $("#itemTable td").slice(first, last + 1)
                        .each((k, elem) =>
                        {
                            const currItem = itemsSortedDescending[first + k];
                            setSelectedState(currItem, elem, false);
                        });
                }
                else if(event.ctrlKey) // range toggle
                {
                    $("#itemTable td").slice(first, last + 1)
                        .each((k, elem) =>
                        {
                            const currItem = itemsSortedDescending[first + k];
                            setSelectedState(currItem, elem, !currItem.isSelected);
                        });
                }
                else // normal selection (individual toggle)
                {
                    const cell = event.currentTarget;
                    setSelectedState(item, cell, !item.isSelected);
                }

                updateTotalPrice();

                previousSelection = index;
            });

            const image = document.createElement("img");
            image.src = currItem.url;
            image.classList.add("itemImage");
            $(image).on("click", () =>
            {
                // only want to focus the item name input if not in price calculation mode
                // TODO -- maybe the name input should never be focused in general, since it never really makes sense to want to keep all the same price and quantities, but change the name (effectively duplicating the item info but with a different item name)?
                if(!shouldShowSelection)
                    itemNameInput.trigger("select");
                // need to update the layout to not include items that just got deselected; I am only putting this in the event handler for clicking on the image itself, since I want the user to be able to modify price/mult and quantity without the item temporarily disappearing
                // this does cause the problem of clicking the border of the cell toggling the item, but not hiding it when the user wants them hidden (since this event only listens for clicking on the image itself, not anywhere in the cell)
                // TODO -- I'm wondering if I should make clicking on quantity/price not change the state of the selection in general, though that could be a bit annoying if the user is trying to quickly select items.
                else if(shouldHideUnselectedItems)
                    updateItemLayout();
            });

            const quantityLabel = document.createElement("p");
            quantityLabel.innerText = currItem.quantity;
            quantityLabel.classList.add("label", "quantityLabel");
            $(quantityLabel).on("click", () =>
            {
                itemQuantityInput.trigger("select");
            });

            const priceLabel = document.createElement("p");
            priceLabel.innerHTML = formatItemPriceLabel(currItem.priceOrMultiplier); // using innerHTML so that coin image is shown
            priceLabel.classList.add("label", "priceLabel");
            $(priceLabel).on("click", () =>
            {
                itemPriceOrMultiplierInput.trigger("select");
            });

            let customQuantityLabel, customPriceLabel;
            if(shouldShowSelection)
            {
                // TODO -- I feel like some of this stuff is redundant/repeated stuff from setSelectedState() (though this stuff isn't technically in the DOM yet)
                if(currItem.customQuantity !== undefined)
                {
                    customQuantityLabel = document.createElement("p");
                    customQuantityLabel.innerText = currItem.customQuantity;
                    customQuantityLabel.classList.add("label", "customLabel", "customQuantityLabel");
                    customQuantityLabel.hidden =  !currItem.isSelected;
                    $(customQuantityLabel).on("click", () =>
                    {
                        itemQuantityInput.trigger("select");
                    });

                    // starts less visible since item is selected and has a custom quantity
                    if(currItem.isSelected)
                        quantityLabel.style.opacity = 0.5;
                }

                if(currItem.customPriceOrMultiplier !== undefined)
                {
                    customPriceLabel = document.createElement("p");
                    customPriceLabel.innerHTML = formatItemPriceLabel(currItem.customPriceOrMultiplier); // using innerHTML so that coin image is shown
                    customPriceLabel.classList.add("label", "customLabel", "customPriceLabel");
                    customPriceLabel.hidden =  !currItem.isSelected;
                    $(customPriceLabel).on("click", () =>
                    {
                        itemPriceOrMultiplierInput.trigger("select");
                    });

                    // starts less visible since item is selected and has a custom price/mult
                    if(currItem.isSelected)
                        priceLabel.style.opacity = 0.5;
                }
            }

            tableCell.appendChild(image);
            tableCell.appendChild(quantityLabel);
            tableCell.appendChild(priceLabel);
            if(customQuantityLabel)
                tableCell.appendChild(customQuantityLabel);
            if(customPriceLabel)
                tableCell.appendChild(customPriceLabel);

            tableRow.appendChild(tableCell);
        }

        itemTable.append(tableRow);
    }

    if(shouldShowSelection || getIsPriceShownInScreenshot())
        updateTotalPrice();

    // I don't want to call this every time, since I feel like it slows down everything (I instead only call it when relevant things resize [items per row count, window size, bottom text])
    // rescaleScreenshotRegion();
}

function formatItemPriceLabel(priceOrMultiplier)
{
    const priceStr = String(priceOrMultiplier);
    const priceStrTrimmed = priceStr.trim();
    return priceOrMultiplier + (!priceStrTrimmed.length || priceStrTrimmed.endsWith('x') ? "" : `<img class="coin" src="${coinImageUrl}">`);
}


function copyImageToClipboard()
{
    if(isActivelyCopyingImage)
        return;
    isActivelyCopyingImage = true;

    const createdBy = document.createElement("p");
    // for those of you reading this, I would appreciate if this doesn't get removed from the generated image
    createdBy.innerText = "jjcuber.github.io/hdig"; // used to say, "Tool Created by JJCUBER"
    createdBy.classList.add("watermark");
    if(!$(".watermark").length) // only append if the watermark always visible on screen didn't get removed
        screenshotRegion.append(createdBy);

    copyImageLoadingWheel.prop("hidden", false); // show loading wheel
    screenshotRegion[0].style.transform = ""; // temporarily remove screenshot region scaling so that image isn't messed up
    itemsPerRowSlider.prop("disabled", true); // temporarily disable items per row slider

    let screenshotBlob;
    let clipboardWrittenPromise;
    // In order for copying an image to clipboard on iOS to work, you HAVE to effectively do it directly in the click (more accurately, pointerup) event; this means that having some promises .then()'d is not "acceptable": https://stackoverflow.com/questions/65356108/how-to-use-clipboard-api-to-write-image-to-clipboard-in-safari  AND  https://stackoverflow.com/questions/62327358/javascript-clipboard-api-safari-ios-notallowederror-message  AND  https://webkit.org/blog/10247/new-webkit-features-in-safari-13-1/
    if(isRunningIOS())
    {
        clipboardWrittenPromise = navigator.clipboard.write(
            [new ClipboardItem(
                {
                    "image/png":
                        (async () =>
                        {
                            // need to run a second time on iOS (it sounds like just returning the .toBlob call and .then()'ing it doesn't work based on https://github.com/bubkoo/html-to-image/issues/52#issuecomment-1255708420 , so that's why I'm awaiting it here [I don't think that would really be all so different from just returning and calling .then, but I will just do it like this since it seems to work])
                            // TODO -- it sounds like this might also happen with safari on mac occasionally?  I might might also want to check for the browser being safari.
                            await htmlToImage.toBlob(screenshotRegion[0]);
                            let blob = await htmlToImage.toBlob(screenshotRegion[0]);

                            screenshotBlob = blob; // I'm pretty sure this has to be done separately, otherwise iOS gets mad (probably due to using a variable of outer scope that is "tainted")

                            return blob;
                        })()
                }
            )]
        );
    }
    else // not iOS
    {
        // htmlToImage.toBlob(..., {canvasWidth: ..., canvasHeight: ..., width: ..., height: ...}) // there are options for canvas Width/Height, along with node's Width/Height, but they aren't really what I'm looking for (zooming out far on the page itself still modifies the scaling of everything)
        clipboardWrittenPromise = htmlToImage.toBlob(screenshotRegion[0])
            .then(blob => new ClipboardItem({"image/png": screenshotBlob = blob})) // also stores the blob in case the error is caught later
            .then(clipboardItem => navigator.clipboard.write([clipboardItem]));
    }

    clipboardWrittenPromise
        .then(createSuccessfulCopyNotification)
        .catch(e =>
        {
            console.log("Unable to generate image and/or copy it to clipboard --", e);

            createFailedCopyNotification();

            // show failed copy overlay if the screenshot was successfully generated
            if(screenshotBlob)
            {
                failedCopyOverlay.imageHolder[0].src = window.URL.createObjectURL(screenshotBlob);


                // shows the failed copy overlay

                failedCopyOverlay.overlay.prop("hidden", false);
                // disables scrolling the main page and removes the scrollbar from the side while the settings button is focused ( https://stackoverflow.com/questions/9280258/prevent-body-scrolling-but-allow-overlay-scrolling )
                $("html, body").css("overflow-y", "hidden");
                // prevents the screenshot region from shifting over to the right due to the scrollbar now missing ( https://stackoverflow.com/questions/1417934/how-to-prevent-scrollbar-from-repositioning-web-page and https://css-tricks.com/elegant-fix-jumping-scrollbar-issue/ and https://aykevl.nl/2014/09/fix-jumping-scrollbar )
                screenshotRegion.css("margin-right", "calc(100vw - 100%)");
            }
        })
        .finally(() =>
        {
            $(createdBy).remove();
            isActivelyCopyingImage = false;

            copyImageLoadingWheel.prop("hidden", true);
            rescaleScreenshotRegion(); // restore screenshot region's scaling
            itemsPerRowSlider.prop("disabled", false);
        });
}

function copyAsTextListToClipboard()
{
    const itemStrs = [];

    const format = textListFormatInput.val();
    const itemsSortedDescending = [...items.values()].sort((item1, item2) => item2.quantity - item1.quantity);
    for(let item of itemsSortedDescending)
        itemStrs.push(formatTextListItem(format, item));

    const textList = itemStrs.join(textListSeparatorRadios[textListSeparatorSelectedRadio].value);
    navigator.clipboard.writeText(textList)
        .then(createSuccessfulCopyNotification)
        //.catch(e => console.log(e));
        .catch(console.log);
}

// maybe include Item somewhere in this function name
function getMaxPrice(itemNameTitleSnakeCase)
{
    const properPageName = handleSpecialPageNames(itemNameTitleSnakeCase);
    const url = "https://hayday.fandom.com/api.php?" +
        new URLSearchParams({
            origin: "*",
            action: "parse",
            page: properPageName,
            format: "json",
            prop: "text", // this makes it so it only fetches the text portion; I might want to swap over to the properties portion instead?  TODO -- look more into this.
        });

    return fetch(url)
        .then(response => response.json())
        .then(json => json.parse.text["*"])
        .then(html =>
        {
            // const priceRange = $(html).find("aside.portable-infobox span[title='Coin(s)']").first().parent().text();
            const priceRange = $(html).find("aside.portable-infobox div[data-source='price']").children().text();
            const maxPrice = parseInt(priceRange.split(" to ")[1]);
            console.log(itemNameTitleSnakeCase, "max price:", maxPrice);
            return maxPrice;
        }).catch(e =>
        {
            console.log(e);
            console.log(itemNameTitleSnakeCase, "max price:", NaN);

            return NaN;
        });
}

// Some hay day wiki url's have special characters and/or differ from the normal in-game names of items; the _ isn't really needed since the api used for getting the site "normalizes" the input
// I was contemplating using the api for query with search, but I don't want to risk getting the wrong page/item price for a given item
const specialPageNameMapping = new Map([
    ["Shepherds_Pie", "Shepherd's_Pie"],
    ["Caffe_Latte", "Caffè_Latte"],
    ["Caffe_Mocha", "Caffè_Mocha"]
]);
function handleSpecialPageNames(itemName)
{
    return specialPageNameMapping.get(itemName) ?? itemName;
}

async function ensureItemsHaveMaxPriceSet()
{
    let shouldSave = false;
    for(let item of items.values())
    {
        // conversion to JSON using stringify makes NaN become null, so I am adding it back here; this is to ensure any calculations with this value yield NaN, instead of something like 0 (null*5 === 0)
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
        // https://stackoverflow.com/questions/21896792/force-json-stringify-to-emit-nan-infinity-or-js-json-lib-that-does-so
        if(item.maxPrice === null)
        {
            item.maxPrice = NaN;
            continue;
        }
        if(item.maxPrice !== undefined)
            continue;

        item.maxPrice = await getMaxPrice(item.name);
        shouldSave = true;

        // updates the total price along the way if currently in price calculation mode (I'm doing this instead of only doing it once at the end so that the user can see the price updating as it gets loaded)
        // TODO -- I don't think I need || shouldShow... here currently, though I might want/need it if I allow for persistent selections at some point
        if(getIsInPriceCalculationMode() || getIsPriceShownInScreenshot())
            updateTotalPrice();
    }

    // I don't foresee any issues with this randomly saving (since this async function is called synchronously to prevent the page from getting stuck while this function executes) because any modification to the items elsewhere would ... never mind
    // this might cause issues, since it could save while in the middle of modifying an item abbreviation; if the user never "commits" these changes themself by closing out of the site (which might prevent the change event from occurring?), then some partially modified state would be saved randomly from this function; it might just be best to have this be redone each time the site loads until the user modifies something themself which forces a save all.
    // if(shouldSave)
        // saveAllToLocalStorage();


    // the solution is to only save the items, since items don't carry any intermediate state (any modification to items is immediately saved to local storage)
    if(shouldSave)
        saveItemsToLocalStorage();
}


function formatTextListItem(format, item)
{
    return format.replaceAll("{{name}}", item.getHumanReadableName())
        .replaceAll("{{quantity}}", item.quantity)
        .replaceAll("{{price}}", item.priceOrMultiplier);
}


function calculateTotalSelectedPrice()
{
    let total = 0;
    let equations = [];
    // TODO -- I should instead filter this BEFORE sorting (doesn't change anything functionally, it's just more performant that way)
    // we go through it in quantity descending order to make the equation be in the same order as the items in the grid
    // TODO -- now that this function gets called from updateItemLayout() whenever showing price in screenshot is enabled, I should probably be caching itemsSortedDescending
    // NOTE: this sorts by descending so that the price gets calculated in the same order as it is displayed (this is important for both the order of the generated price equation and for the order in which warning/error messages occur and "halt" the calculation)
    const itemsSortedDescending = [...items.values()].sort((item1, item2) => item2.quantity - item1.quantity);
    let message, isError = false;
    for(let item of itemsSortedDescending)
    {
        if(!item.isSelected)
            continue;

        let [itemTotalPrice, equation, error, warning] = item.calculateTotalPrice();

        // this is always done since it'll make sure that the total becomes NaN if there is an error
        total += itemTotalPrice;

        // should push the current equation, even if it causes an error below (so that the user can see where in the equation it happened)
        equations.push(equation);

        if(error)
        {
            console.log(error);

            message = error;
            isError = true;
            break;
        }

        if(warning)
        {
            console.log(warning);

            // only want to show first warning
            message ??= warning;
        }
    }

    const hasMessage = message !== undefined;
    if(hasMessage)
    {
        totalSelectedPriceMessageHolder.text(message);
        totalSelectedPriceMessageHolder.css("color", isError ? "red" : "purple");
    }
    totalSelectedPriceMessageHolder.prop("hidden", !hasMessage);

    totalSelectedPriceEquationHolder.text(equations.join(" + "));

    return total;
}

// calculates the total price of ALL items, selected or not (does not modify the price calculation area's message holder stuff)
function calculateTotalPrice()
{
    let total = 0;
    // TODO -- I should instead filter this BEFORE sorting (doesn't change anything functionally, it's just more performant that way)
    // we go through it in quantity descending order to make the equation be in the same order as the items in the grid
    // TODO -- now that this function gets called from updateItemLayout() whenever showing price in screenshot is enabled, I should probably be caching itemsSortedDescending
    // Technically, this doesn't need to sort by descending, since unlike the function which calculates total for the SELECTED price, this one is doing it for all; if an error occurs, the outcome of the values will be NaN regardless of order (the only thing that will be different is what gets logged in the console in the event of an error)
    const itemsSortedDescending = [...items.values()].sort((item1, item2) => item2.quantity - item1.quantity);
    for(let item of itemsSortedDescending)
    {
        let [itemTotalPrice, equation, error, warning] = item.calculateTotalPrice();

        // this is always done since it'll make sure that the total becomes NaN if there is an error
        total += itemTotalPrice;

        if(error)
        {
            console.log(error);
            break;
        }
    }

    return total;
}

// TODO -- it might be better to check whether in price calculation mode here (and/or if price is shown in the screenshot) instead of everywhere before calling this function, though that might be slower in scenarios where I have the state (of whether being in price calculation mode or not) cached.
function updateTotalPrice()
{
    const totalSelectedPrice = calculateTotalSelectedPrice();
    const totalSelectedPriceFormatted = totalSelectedPrice.toLocaleString();

    // hasn't loaded yet
    if(!priceCalculationItem)
        return;

    const totalSelectedPriceInItems = +(totalSelectedPrice / priceCalculationItem.maxPrice).toFixed(2); // the unary + converts it back to a number, removing trailing zeroes
    const totalSelectedPriceInItemsFormatted = totalSelectedPriceInItems.toLocaleString();

    const selectedCount = getSelectedItemCount();

    const totalSelectedPriceHTML = `${totalSelectedPriceFormatted}<img src="${coinImageUrl}" style="width: 14px; height: 14px;"><span style="display: inline-block; width: 10px;"></span>${totalSelectedPriceInItems}<img src="${priceCalculationItem.url}" style="width: 14px; height: 14px;"><span style="display: inline-block; width: 10px;"></span>(${selectedCount} items)`;

    const isInPriceCalculationMode = getIsInPriceCalculationMode();

    if(isInPriceCalculationMode)
        totalSelectedPriceHolder.html(totalSelectedPriceHTML);

    if(getIsPriceShownInScreenshot())
    {
        if(!isInPriceCalculationMode && shouldShowTotalInNormalMode)
        {
            const totalPrice = calculateTotalPrice();
            const totalPriceFormatted = totalPrice.toLocaleString();

            const totalPriceInItems = +(totalPrice / priceCalculationItem.maxPrice).toFixed(2); // the unary + converts it back to a number, removing trailing zeroes
            const totalPriceInItemsFormatted = totalPriceInItems.toLocaleString();

            const itemCount = getTotalItemCount();

            const totalPriceHTML = `${totalPriceFormatted}<img src="${coinImageUrl}" style="width: 14px; height: 14px;"><span style="display: inline-block; width: 10px;"></span>${totalPriceInItems}<img src="${priceCalculationItem.url}" style="width: 14px; height: 14px;"><span style="display: inline-block; width: 10px;"></span>(${itemCount} items)`;
            screenshotPriceHolder.html(totalPriceHTML);
        }
        else
            screenshotPriceHolder.html(totalSelectedPriceHTML);
    }
}


function getIsInPriceCalculationMode()
{
    return !totalSelectedPriceArea.is("[hidden]");
}

function getIsPriceShownInScreenshot()
{
    // TODO -- for this and other checkbox-related settings, should I be looking at the settings themselves for the state of things, or should I be looking at the elements that are set as visible, hidden, etc. like what I do right here?
    return !screenshotPriceHolder.prop("hidden");
}


function setSelectedState(item, cell, isSelected)
{
    item.isSelected = isSelected;

    // TODO -- classList.toggle() is a thing, maybe use this instead of the if/else?  toggle can either toggle based on whether the class is on the element or based on whether the second parameter passed is true.  https://developer.mozilla.org/en-US/docs/Web/API/DOMTokenList/toggle
    if(isSelected)
        cell.classList.add("selected");
    else
        cell.classList.remove("selected");

    const cellSelector = $(cell);
    cellSelector.find(".customLabel").prop("hidden", !isSelected);

    // make quantity/price less visible when this item is selected and has a custom value
    cellSelector.find(".quantityLabel").css("opacity", isSelected && item.customQuantity !== undefined ? 0.5 : 1);
    cellSelector.find(".priceLabel").css("opacity", isSelected && item.customPriceOrMultiplier !== undefined ? 0.5 : 1);
}

function setSelectedStateAll(items, cells, isSelected)
{
    for(let item of items)
        item.isSelected = isSelected;

    for(let cell of cells)
    {
        if(isSelected)
            cell.classList.add("selected");
        else
            cell.classList.remove("selected");

        $(cell).find(".customLabel").prop("hidden", !isSelected);
    }
}


async function prepareAllItemNames()
{
    const itemNames = await getAllItemNames();

    const prepared = [];
    for(let itemName of itemNames)
        prepared.push(fuzzysort.prepare(itemName));

    return prepared;
}

// gotten from https://hayday.fandom.com/wiki/Supplies (if I got the images for these the same way as I did for everything else, there would be a ton of building images listed as items)
const suppliesNames = ["Axe", "Dynamite", "Saw", "Shovel", "TNT Barrel", "Pickaxe", "Bolt", "Brick", "Duct Tape", "Hammer", "Hand Drill", "Nail", "Paint Bucket", "Plank", "Screw", "Stone Block", "Tar Bucket", "Wood Panel", "Land Deed", "Mallet", "Map Piece", "Marker Stake"];
// extraneous "item"/image names (due to how the item names are fetched) that shouldn't be included; "Honey Mask" is a duplicate of "Honey Face Mask"
const nameBlacklist = new Set(["Chicken Feed", "Cow Feed", "Pig Feed", "Sheep Feed", "Red Lure", "Green Lure", "Blue Lure", "Purple Lure", "Gold Lure", "Fishing Net", "Mystery Net", "Goat Feed", "Lobster Trap", "Duck Trap", "Honey Mask", "Field", "Apple Tree", "Shop Icon", "Coins", "Experience", "Caffè Latte", "Caffè Mocha"]);
async function getAllItemNames()
{
    const fetchPortion = (pageName) =>
    {
        const url = "https://hayday.fandom.com/api.php?" +
            new URLSearchParams({
                origin: "*",
                action: "parse",
                page: pageName,
                format: "json",
                prop: "images", // this makes it so it only fetches the images portion
            });

        return fetch(url)
            .then(response => response.json())
            .then(json => json.parse.images)
            .then(images => images.map(image => image.split(".png")[0].replaceAll("_", " ")));
    };

    const productNames = await fetchPortion("Products");
    const cropNames = await fetchPortion("Crops");
    const animalProductNames = await fetchPortion("Animal_Goods");

    return productNames.concat(cropNames, animalProductNames, suppliesNames).filter(name => !nameBlacklist.has(name));
}

function updateFuzzyMatches()
{
    // don't want the list of matches popping up when the user is trying to select/deselect items
    // also don't want to continue if the item names haven't been prepared yet; I could easily set a flag for this case and just call this function again when the prepared items are completely set up, but that would have an extra edge case of whether the name input is still focused (ultimately, the item names should get loaded and prepared quite quickly, so the user shouldn't really run into this in practice)
    if(getIsInPriceCalculationMode() || !preparedItemNames)
        return;

    const matches = fuzzysort.go(itemNameInput.val(), preparedItemNames, {limit: 10});

    const matchHTMLs = [];
    let i = 0;
    for(let match of matches)
    {
        i++;

        const div = document.createElement("div");

        const button = document.createElement("button");
        button.tabIndex = -1;
        button.innerHTML = fuzzysort.highlight(match, "<b style='color: orange;'>", "</b>");
        $(button).on("mousedown", {itemName: match.target}, (event, customParams) =>
        {
            itemNameInput.val(event.data.itemName);

            // need to wait for the mouseup event in order to refocus/reselect the input field (using .one to make sure it only happens once, and using the document as the object to ensure this occurs no matter where on the screen the mouseup happens)
            // TODO -- I need to standardise all of my arrow functions; particularly, I need to decide whether to always include the () even for single parameter, and I need to determine whether it is a good idea to have arrow functions like this that are a single line (without {}) which calls a function (I don't know how "proper" this is, and it could easily lead to accidentally forgetting the () =>, causing it to misbehave)
            // TODO -- should I keep the matches empty after the user selects one (until they start typing again)?
            if(!customParams || !customParams.usedKeyboard) // don't want to do this if the user selected a match using the keyboard via 1-9,0
                // This must be applied to every element due to how event bubble up (if you release your mouse on an item cell after clicking down on a fuzzy match, it will trigger the item's events first before bubbling/propagating up; this means that the only solution is to put the handler on every element, stop propogation, and cancel all the remaining events added via this "namespace" (.fuzzyMatchClick)).  Unfortunately, managing to click the border of an item cell on the mouseup event will end up executing that first, likely do to having same priority but having different event added order (this event is added after).
                // TODO -- I might be able to fix this by storing the values for all 3 inputs and just modify it in my event listener below, which means that I would want to go back to using $(document) so that it has the least specificity (which means it will execute last, reverting all the values to normal).
                $("*").one("mouseup.fuzzyMatchClick", (e) =>
                {
                    itemNameInput.trigger("focus");
                    e.stopPropagation();

                    $("*").off(".fuzzyMatchClick");
                });
        });

        const p = document.createElement("p");
        p.innerText = i === 10 ? 0 : i;


        div.appendChild(button);
        div.appendChild(p);

        matchHTMLs.push(div);
    }

    fuzzyMatchesHolder.empty();
    fuzzyMatchesHolder[0].append(...matchHTMLs);
}


function createSuccessfulCopyNotification()
{
    let notification = document.createElement("p");
    notification.innerText = "Successfully Copied!";
    notification.classList.add("notification", "notificationSuccess");
    $(notification).on("animationend", notification.remove);
    document.body.appendChild(notification);
}

function createFailedCopyNotification()
{
    let notification = document.createElement("p");
    notification.innerText = "Failed to Copy!";
    notification.classList.add("notification", "notificationFail");
    $(notification).on("animationend", notification.remove);
    document.body.appendChild(notification);
}


// TODO -- I might want to eventually be rescaling the cells, though that would be a lot of work to modify all the css
function rescaleScreenshotRegion()
{
    // If the user starts scrolling, zooming in, etc, don't want to rescale the screenshot region (I noticed this happening if a user on iOS starts scrolling in such a way where the address bar grows in size [triggering window resize])
    if(isActivelyCopyingImage)
        return;

    // I take the min of these to ensure that everything always stays on screen (it takes into account both a longer bottom text and what the width would be if all items were in the table)
    const heuristicFactor = document.documentElement.clientWidth / ((itemsPerRow + 1) * 110); // estimated width of table with all items in row filled in
    const actualFactor = 0.9 * document.documentElement.clientWidth / screenshotRegion.width(); // actual calculated width of table (including bottom text)

    const scaleFactor = Math.min(1, heuristicFactor, actualFactor); // 1 is included in the list of mins because I don't want to ever scale up, only down (if needed)
    screenshotRegion[0].style.transform = `scale(${scaleFactor})`;
}

function getSelectedItemCount()
{
    let count = 0;
    for(let item of [...items.values()])
    {
        if(item.isSelected)
            count += item.customQuantity ?? item.quantity;
    }

    return count;
}

function getTotalItemCount()
{
    let count = 0;
    for(let item of [...items.values()])
        count += item.customQuantity ?? item.quantity;

    return count;
}


/* -------- scripts/Settings.js -------- */
function setUpAbbreviationMappingTable()
{
    for(let [abbreviation, abbreviationExpanded] of abbreviationMapping)
        addAbbreviationMappingTableRow(abbreviation, abbreviationExpanded);

    ensureExtraAbbreviationMappingTableRow();
}

function addAbbreviationMappingTableRow(abbreviation, abbreviationExpanded)
{
    const abbreviationTableRow = document.createElement("tr");

    const abbreviationCell = document.createElement("td");
    const abbreviationExpandedCell = document.createElement("td");

    const abbreviationInput = document.createElement("input");
    const abbreviationInputSelector = $(abbreviationInput);
    abbreviationInputSelector.on("change", handleAbbreviationChange);
    abbreviationInput.type = "text";
    abbreviationInput.style.maxWidth = "8em";
    abbreviationInput.value = abbreviation;
    abbreviationInput.dataset.previousValue = abbreviation;

    const abbreviationExpandedInput = document.createElement("input");
    const abbreviationExpandedInputSelector = $(abbreviationExpandedInput);
    abbreviationExpandedInputSelector.on("change", handleAbbreviationChange);
    abbreviationExpandedInput.type = "text";
    abbreviationExpandedInput.style.maxWidth = "8em";
    abbreviationExpandedInput.value = abbreviationExpanded;
    // abbreviationExpandedInput.dataset.previousValue = abbreviationExpanded;

    // TODO -- important: not relevant here, but whenever the callback function for a jquery event returns false, this automatically causes event.stopPropagation() and event.preventDefault() to be called ( said in https://api.jquery.com/on/ and  https://stackoverflow.com/questions/2457246/jquery-click-function-exclude-children )

    // make clicking the border/cell itself still focus the relevant input
    // .target is where the event originated from/got triggered from, and .currentTarget is where the current event callback is attached to (so if the user clicks in the input field, the target is the input field, but the current target is the td, meaning I don't need to trigger focus: https://stackoverflow.com/questions/10086427/what-is-the-exact-difference-between-currenttarget-property-and-target-property )
    $(abbreviationCell).on("click", (e) =>
    {
        // only need to focus if the cell is what was actually clicked on (target is what was clicked on [might be input or td], current target is what this callback is binded to [td])
        if(e.target === e.currentTarget)
            abbreviationInputSelector.trigger("focus");
    });
    $(abbreviationExpandedCell).on("click", (e) =>
    {
        // only need to focus if the cell is what was actually clicked on (target is what was clicked on [might be input or td], current target is what this callback is binded to [td])
        if(e.target === e.currentTarget)
            abbreviationExpandedInputSelector.trigger("focus");
    });


    abbreviationCell.appendChild(abbreviationInput);
    abbreviationExpandedCell.appendChild(abbreviationExpandedInput);

    abbreviationTableRow.appendChild(abbreviationCell);
    abbreviationTableRow.appendChild(abbreviationExpandedCell);

    abbreviationMappingTable.append(abbreviationTableRow);
}

function handleAbbreviationChange(event)
{
    const previousValue = event.target.dataset.previousValue;

    const row = $(event.target).closest("tr");
    const cells = row.find("input");
    const abbreviation = cells.eq(0);

    if(!abbreviation.val().length)
    {
        removeAbbreviation(previousValue);
        row.remove();

        ensureExtraAbbreviationMappingTableRow();

        return;
    }
    const abbreviationExpanded = cells.eq(1);

    abbreviation.val(abbreviation.val().trim().toLowerCase());
    abbreviationExpanded.val(abbreviationExpanded.val().trim().toLowerCase());

    updateAbbreviation(previousValue, abbreviation.val(), abbreviationExpanded.val());

    abbreviation[0].dataset.previousValue = abbreviation.val();

    ensureExtraAbbreviationMappingTableRow();
};


function removeAbbreviation(abbreviation)
{
    abbreviationMapping.delete(abbreviation);

    saveAllToLocalStorage();
}

function updateAbbreviation(oldAbbreviation, newAbbreviation, abbreviationExpanded)
{
    abbreviationMapping.set(newAbbreviation, abbreviationExpanded);

    if(oldAbbreviation !== newAbbreviation)
        removeAbbreviation(oldAbbreviation);
    else
        saveAllToLocalStorage(); // removeAbbreviation() handles saving when called; no need to do it twice in that case
}


function ensureExtraAbbreviationMappingTableRow()
{
    const lastRow = abbreviationMappingTable.find("tr").last();
    const abbreviation = lastRow.find("input").first();

    if(!abbreviation.length || abbreviation.val().length)
        addAbbreviationMappingTableRow("", "");
}


/* -------- scripts/Persist.js -------- */
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

    const sAbbreviationMapping = localStorage.getItem("abbreviationMapping");
    if(sAbbreviationMapping)
        abbreviationMapping = new Map(JSON.parse(sAbbreviationMapping));

    const sBottomText = localStorage.getItem("bottomText");
    bottomText[0].innerText = sBottomText ?? "Partials Accepted"; // just like the abbreviations, I give a "reasonable" default

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
}

function saveAllToLocalStorage()
{
    // console.log("Saved");
    saveItemsToLocalStorage();
    localStorage.setItem("abbreviationMapping", JSON.stringify([...abbreviationMapping]));
    localStorage.setItem("bottomText", bottomText[0].innerText); // must use innerText for newlines to be handled properly
    // localStorage.setItem("bottomText", bottomTextSettingInput.val()); // can just use the setting input's value instead, though maybe I should keep it consistent with the loadAll, due to the way I load it into the bottom text then into the setting
    localStorage.setItem("itemsPerRow", itemsPerRow);
    localStorage.setItem("textListSeparatorSelectedRadio", textListSeparatorSelectedRadio);
    localStorage.setItem("textListCustomSeparator", textListCustomSeparatorInput.val());
    localStorage.setItem("textListFormat", textListFormatInput.val());
    localStorage.setItem("priceCalculationItem", priceCalculationItemInput.val());

    // TODO -- finish up "Selections category and add it here; might want to combine thing right below this into this"

    localStorage.setItem("showPriceInScreenshot", showPriceInScreenshotCheckBox.prop("checked"));
    localStorage.setItem("showTotalInNormalMode", shouldShowTotalInNormalMode);
}

function saveItemsToLocalStorage()
{
    localStorage.setItem("items", JSON.stringify([...items], (key, value) => Item.fieldsToOmitFromLocalStorage.has(key) ? undefined : value));
}


/* -------- scripts/Changelog.js -------- */
const changelog = new Map([
    ["v2.11", `Features:
- Added setting to show total price in normal mode for the generated image (as in, the price of all items, regardless of whether they are selected; this defaults to being enabled so long as you have the base "Show Selected Price" setting enabled)`],
    ["v2.10.1", `Bug Fixes:
- Fixed some item urls (or only one?) no longer working (seemingly caused by a change in how the wiki api schema is for certain edge cases)`],
    ["v2.10", `Features:
- Added setting to show selected price in the generated image (defaults to being enabled)

UI:
- Made the selected price information fade in when toggled on by the setting

Misc:
- Minor code/performance improvements`],
    ["v2.9.2", `Bug Fixes:
- Fixed being able to scroll the page behind an overlay (this was a regression)`],
    ["v2.9.1", `Features:
- the total quantity of selected items is now shown when in price calculation mode

UI Changes:
- quantity and price labels now fade in/out

Note:
- Sorry for the lack of updates recently.  I have been quite busy IRL these past few weeks.  I still have plans to add tons of features over time, but development might be a bit slower than it used to be.  Regardless, feel free to join the discord (by clicking the "Contact" button) to suggest new features and/or to ask for help!
- There is now a full text-based tutorial and a video tutorial of how to use this site (it is in the discord server, though I will eventually incorporate it into the site).`],
    ["v2.9", `UI Changes:
- The item grid/region now scales to fit on your screen/display without needing to scroll/zoom (this does not affect the generated image since the item grid's scale temporarily gets reset while generating the image).  It also takes into account the bottom text being wider than the item grid.

Bug Fixes:
- Preserved numerical types when loading from local storage (this didn't cause issues in any live version of the tool/site)
- Disabled changing the number of items per row and adding/modifying/deleting items while the image is in the process of being generated

Misc:
- Removed duplicated item names with accented name variant (Caffè Latte and Caffè Mocha; the non-accented versions of the names still work, I just removed the accented variants)`],
    ["v2.8.1", `Bug Fixes:
- Made delete button do nothing when name input is empty (previously, it would set the quantity to 0; this isn't exactly a bug)
- finally fixed the weird gap between fuzzy matches on mobile
- fixed item cells getting warped when on a small screen with too many columns specified (images still maintain their aspect ratio, but they no longer scale down way below 100x100)`],
    ["v2.8", `Features:
- Added a delete button (outside of price calculation/selection mode; I added it since people might find it more intuitive when newer to the tool)
- Disabled native autocomplete that could sometimes show up over top my own fuzzy autocomplete

UI Changes:
- made images that aren't a 1:1 aspect ratio not stretch (images already smaller than 100x100 also don't get blown up)
- fixed gap between fuzzy matches on pc (still struggling to fix it on mobile for some reason)`],
    ["v2.7", `Features:
- Upon your first time ever using the site, the items per row count now defaults to whatever will comfortably fit on screen for the user (up to a max of 8 DEFAULT); this will not affect you if you have used the site before
- Clicking the bottom text now (in addition to already focusing the setting to modify it) additionally scrolls to the setting to ensure that it is on screen (especially on mobile)

UI Changes:
- Made buttons and inputs look the same across all platforms
- Added a submit button for adding/modifying items (since many people were confused by simply pressing enter to submit; that way still works, this is just another way of submitting the changes)
- Made formatting look the same across all platforms as well
- Made the UI/page scale up to the width of phone screens so that it isn't so tiny
- Decreased the size of input boxes (and made it relative to the default font size being used, which is dependent on the device; iOS devices are forced to 16px, since that's what iOS requires for font size in order to not zoom in when focusing an input)
- Made selecting a fuzzy search result/match not highlight the new text (instead putting the cursor at the end of the word(s))
- Buttons that get wrapped to the next line (most noticeable on smaller screens, i.e. mobile phones) now have a gap between them, making it look less crowded/bad
- Improved the layout/styling of the settings overlay (input boxes now fit properly to the dimensions of the overlay dependant on how large your device is, the abbreviation mappings table can't take up too much of the screen anymore which allows for easily scrolling to the rest of the settings on mobile)
- Ensured that the contact overlay always has a reasonable width (since it is so small)

Bug Fixes:
- Fixed issues with the bottom text in the generated image on android

Misc:
- minor code improvements`],
    ["v2.6", `Major Fix:
- Copy image button (finally) works on mobile!  It should automatically copy the image just by clicking the button.  If it does not (if you still get a popup saying copy failed), please click the "Contact" button and let me know, since that shouldn't be happening.`],
    ["v2.5", `Features:
- Added a "Contact" overlay which has a link to the discord server I created for this tool, along with a link for creating an issue on GitHub

UI Changes:
- Added a slight shadow/outline to item images, along with changing the color when hovering (this gives a bit more contrast to items with a similar color to the background)
- Made the minimum width for the box portion of overlays be 20% (that way, it wouldn't ever be too small)

Misc:
- A fair bit of code cleanup`],
    ["v2.4.2", `UI Changes:
- Made the "image failed to copy" overlay always have a width of 80% (the image would be quite tiny on some devices otherwise)`],
    ["v2.4.1", `UI Changes:
- Made generated image in (failed to copy) overlay rescale in size to properly fit on screen

Bug Fixes:
- Added animal byproducts to the search functionality (they were previously missing, though those items could still be added if you typed the full name out)`],
    ["v2.4", `Features:
- Added all the names of tools and expansion materials to the fuzzy searching list (they were always addable, but they previously weren't part of the list of terms to show as matches)
- Made a blacklist to the fuzzy search list for some item names which aren't sellable (such as lures and feed); you can still add the items by typing the full names if you really want to, though

UI Changes:
- Made the name input no longer get focused when clicking on the image of an item while in price calculation mode (this makes it less annoying to select/deselect items on mobile, since the name input will no longer be focused with every click)
- Made the fuzzy matches list get cleared after submitting an item

Bug Fixes:
- Fixed an obscure bug where typing 1-9,0 to select a fuzzy match would still add an event to the document, where the first click anywhere would refocus the name input`],
    ["v2.3.2", `UI Changes:
- When specifying a custom price or quantity for a selected item (in price calculation mode), the original value now gets dimmed out to make it more clear.
- Outlines and shadows now look slightly different (look at Bug Fixes for more info)
- Made the 'X'/close button in overlays stay on screen when scrolling (before it could be scrolled away from).

Bug Fixes:
- Changed how I do outlines and shadows to resolve newer iOS devices not showing said outlines and shadows in the generated image.`],
    ["v2.3.1", `Bug Fixes:
- Fixed images not properly loading in screenshot for iOS devices (this might be an issue for Macs as well when using safari, but I have no way of testing it; let me know if you run into this issue)
- Fixed outlines not showing in screenshot for iOS devices

UI Changes:
- Changed the color and outlines of price/multiplier and quantity labels (they should be more readable now)
- Made the list of matches fade in when there previously weren't any/when the input is focused (it fades in only when going from a state of being empty -> non-empty)

Misc:
- Cleaned up and organized css`],
    ["v2.3", `Features:
- Added toggle to hide unselected items (when in price calculation mode)
- Added a (green) notification when something got successfully copied (image/text of item list), coupled with a nice animation (more about the animation in UI Changes)
- Added a (red) notification when something fails to get copied (same animation as ^)
- Made clicking the small border around any of the inputs in the abbreviation mappings table (within settings) focus the input itself (in case you are unlucky enough to manage to click just outside of the input)
- Added a loading wheel animation while in the process of generating and copying the image of the grid of items
- Added an overlay which shows when the image is successfully generated but fails to copy to the clipboard (usually due to the page not having focus or the user being on a mobile device); this overlay presents the generated image, allowing the user to still copy/save it by right clicking/long-pressing (depending on what device they are using)

UI Changes:
- Disabled fuzzy search/matches popup while in price calculation mode (there wasn't any need for it to be popping up while selecting/deselecting items)
- Animations and transitions GALORE (mentioned throughout the remaining bullet points)
- Made notifications fade and slide in/out (they slide in/out from the top of the screen and stay there for a few seconds)
- Added smooth transitions/animations to the outlines of items in the table/list, price/quantity labels, and more (primarily relating to the color of the outlines)
- Improved the look of the outlines of elements (such as buttons and inputs)
- Made all toggle-related buttons have a red outline while "activated" (only when they are not disabled; for example, if showing the equation for the total price is enabled, but price calculation mode is not currently active, the button for enabling the showing of the equation won't have a red outline)
- Made overlays fade in when opened
- Made price calculation mode's tooltip fade in when enabling said mode
- Added some nice animations when modifying the item table in any way (adding items, removing items, editing items, resizing the table) to make it feel more "alive"/"responsive"
- Animation when focusing any input field (of the background color turning yellow); this helps with seeing what got focused and/or whether something is focused
- Added a little animation when clicking buttons (makes it feel more responsive and makes it clear that the button is actually being clicked)
- Added transition when buttons change state between being enabled <-> disabled (fades in/out instead of instantly changing)
- The entire total price calculation area fades in when enabled
- Whenever a warning/error message appears in the price calculation area, it will fade in (if there wasn't previously a warning/error on screen)
- Same as ^ for the equation for the total price
- Reordered the price calculation area slightly to have the message at the very bottom instead of before the equation
- Made the price calculation area's message transition/animate the change in color when going between warning <-> error
- Made the item table not shift around slightly when opening/closing overlays (settings, changelog, etc.) in the (probably rare) case where you have bottom text long enough to wrap around
- Made the items per row slider more vertically centered

Misc:
- Some code cleanup`],
    ["v2.2", `Features:
- Added fuzzy searching/matching for item names, making it much easier and faster to input the name of a given item.  Fuzzy searching basically allows you to skip letters and even have them partially out of order, while still finding the "best" matches.  Give it a try, and you will see what I mean (it also shows visually what part of the matched terms it is "selecting").
- In addition to clicking from the list of matches, you can input 1-9, 0 while typing a name to select that numbered match to fill in.

UI Changes:
- The grid now centers relative to the bottom text when the bottom text is wider than the grid.  (I initially made the grid just center completely on the page, but that would cause items to shift to the left/right visually when adding/removing items from the first row, which would be a bit annoying.)

Misc:
- Split the js file into multiple separate purposeful files/file names.  (Also wrote a script which compiles all the js files into a single one for actual use by github pages.)`],
    ["v2.1", `Features:
- Popups now close when you click "out of them" (when you click the semi-transparent background); this makes it easier to exit without scrolling back up to the x button (also working on getting that x button to stay put at some point)

UI Changes:
- Changed color of outline when hovering over selected items (to make it easier to tell when you are hovering over something that is also selected)
- Made price/multiplier labels be pure black with no outline (more readable)

Misc.:
- Removed use of some deprecated jQuery functions`],
    ["v2.0", `MAJOR (Overview):
- A Price Calculation Mode was added, which supports a ton of stuff (multiple ways to quickly select/deselect individual/ranges of items, custom quantities and prices/multipliers for selection mode, automatic price calculation of selected items, a way to see the equation used for the calculation, and more)
- improved UI (in the way of making it clear what is clickable, what is happening, etc.)
- setting additions and improvements (allowing more customizability)

All Features Added:
- Added fetching items' max prices (retroactively applies to items that were added in an older version)
- Added support for multiline bottom text
- Added parsing and calculating of item's total price
- Added setting for custom text list format (it supports the special variables {{name}}, {{quantity}}, and {{price}}; it also supports being multiline)
- Added a price calculation mode (which support calculating total price, along with selecting items, custom quantities, custom prices/multipliers, etc.)
- Added clear selection button
- Selection state of items is maintained even outside of price calculation mode until the site is reloaded (which allows for going out of price calculation mode, adding an item, then going back in without losing your selections)
- Added select all button
- Added total price calculation for selected items (in coins and items, such as rings)
- Added setting for what item to use for price calculation (for example, chaps or dresses in place of rings)
- Added custom quantity and price for selected items
- Added button to reset/wipe custom quantity and prices
- Added support for starting a quantity of an item with an operator (such as +,-,*,/) to scale the current quantity accordingly (if the item isn't already added, the quantity will be calculated like normal, which allows for putting some equation like -2+5*3^4/...).  If in price calculation mode and you have a custom quantity, that value will be used for the calculation instead.
- Added a button to toggle visibility of the equation used for calculating the total price in price calculation mode
- Made empty custom quantity/multiplier default back to the normal (full) value
- Empty quantity now gets treated as a 0 (now you can simply wipe out the quantity field of an item to remove it without having to type 0, -1, etc.)
- Made custom quantity reset to normal if the normal value gets updated (outside of price calculation mode) to go from being > the custom value to being <= the custom value (keeps the custom quantity upper-bounded by the normal quantity if it was previously upper-bounded by said normal quantity)
- Added subtract selected quantities button (custom quantities get subtracted from the normal quantity; any item without a custom quantity or which falls beneath a quantity of 1 gets automatically removed)
- Added delete selected button
- Added multiple ways to select items in price calculation mode: Click = individual toggle, Shift+Click = range additive, Alt+Click = range subtractive, Ctrl+Click = range toggle (invert)

UI Changes:
- Made hovering over quantity or price/multiplier highlight it with a different color (showing that it's clickable)
- Made all buttons show the cursor pointer when hovered over
- Improved spacing between buttons
- Made name input turn red when an invalid item name is submitted
- Added warning and error information for price calculation to the UI (warnings for items without a price/multiplier getting defaulted, and errors for items that aren't sellable, such as cow or pig)
- Added a way to see the equation used for calculating the total price in price calculation mode
- Added blurb describing the keybinds of price calculation mode (only shows when in price calculation mode); "Click = individual toggle, Shift+Click = range additive, Alt+Click = range subtractive, Ctrl+Click = range toggle (invert)"
- Made the total price update along the way while item prices are being loaded (only relevant if you have items saved from before this version which need to have their prices fetched)
- Added a changelog (it pops up automatically when first launching the site ONLY when it detects that the site has updated to a new version since the last time you opened it; it won't keep pestering you)

Bug Fixes:
- Fixed empty price/multipliers still including the coin image by itself
- Fixed settings background not covering the whole screen when scrolled (also fixed being able to scroll the main page while in the setting popup)
- Fixed spamming of copy image to clipboard button sometimes causing temporary repeated watermarks
- Fixed having a long bottom text with only 1-2 items cutting off the text in the generated screenshot`],
    ["v1.5.2", `Fixed:
- item name "Frutti di Mare Pizza" not working

Notes:
- I have some major features being worked on right now (which aren't ready to commit to here yet), but I wanted to get this fix out quickly.
- To my knowledge, all product names should be properly working now (other than lures which are on the products page for hay day, https://hayday.fandom.com/wiki/Products , but they can't be traded anyway); I still have to do more sleuthing to make sure there aren't any other "non product" items with messed up names.`],
    ["v1.5.1", `Fixed:
- item names containing the word "and" not working`],
    ["v1.5", `Features Added:
- Made bottom text clickable, allowing you to more quickly modify what it says
- Added clear all button (with a confirmation popup), which removes all items currently added

UI Changes:
- Added some text describing the ability to click an image, quantity, or price to populate all the fields and autofocus the respective one (also mentioned the new ability to click the bottom text to modify it)

Misc. Improvements:
- Added some code to aid in preventing cached versions of the css/js files from being used whenever the site has recently been updated`],
    ["v1.4", `UI Changes:
- Improved the look of the site
- Removed underlines
- Made font (Arial) consistent site-wide
- Moved notes to be part of headers (h2) and made said notes smaller than the rest of the text in the header
- Added special name mapping to BLT Salad so that it would be addable as an item (special name mappings have to be made for names that have abbreviations as a word; the current ones I could find are TNT and BLT)

Bug Fixes:
- Fixed #4 (I sorted the items properly, then proceeded to use the original items object instead of the temporary sorted one)

Whenever I update, you might need to clear cookies on the site to remove the old cached files.  For now, I would recommend clearing cookies, then modifying a setting/item BEFORE refreshing the page so that it all gets stored back into local storage and you don't lose anything.  I am planning on making an import/export system, along with some sort of way to notify someone if any of the cached files are outdated.`],
    ["v1.3", `Features Added:
- Copy to clipboard items as a text list
- Customizable separators of the text list (With 2 default options of newline and comma; the third option allows you to type any string for the separator)

Changes:
- Improved UI layout (particularly for the settings popup)

Bugs Fixed:
- #2`],
    ["v1.2", `Forgot to manually change the size of the coin image (in relation to #1).`],
    ["v1.1", `Fixes the weird issue with images yielding a 404 only on github pages.`],
    ["v1.0", `Main features are:
- creating a grid of item listings
- selecting items to modify their information (set quantity to 0 to remove)
- clicking on the image portion vs the quantity portion vs the price portion of an item focuses and highlights the text of said respective textbox
- changeable number of items per row
- modifiable bottom text
- modifiable abbreviations
- persistent settings/state (refreshing retains your layout, abbreviations, etc.)
- single-click image/screenshot creation (copies it to clipboard to allow quickly pasting)
- auto sorting of items by descending quantity


Some future features:
- Generation of text/list form of items (mostly finished, but not a part of the version)
- More settings (change sort directions/type, manual import/export of items, abbreviations, settings, etc.)
- A few other small QOL ideas that might not be added


There might be a bug or two since I added a lot of features today (in order to release v1.0 ASAP); sorry for any inconveniences.`]
]);
function setUpChangelog()
{
    let changes = [];
    for(let [versionName, versionChanges] of changelog)
    {
        const changeHolder = document.createElement("div");

        const changeHeader = document.createElement("h2");
        changeHeader.innerText = versionName;
        changeHeader.style.textAlign = "center";

        const changeBody = document.createElement("p");
        changeBody.innerText = versionChanges;

        changeHolder.appendChild(changeHeader);
        changeHolder.appendChild(changeBody);

        changes.push(changeHolder);
    }

    // effectively interweaves an hr element between each change div
    changelogOverlay.inner.append(changes.flatMap(elem => [elem, document.createElement("hr")]).slice(0, -1));
}

// TODO -- I might want to put all of the local storage-related calls in wrapper functions in Persist.js
function handleVersionChange()
{
    const latestVersion = changelog.keys().next().value;
    const sLastUsedVersion = localStorage.getItem("lastUsedVersion");

    if(sLastUsedVersion === latestVersion)
        return;

    localStorage.setItem("lastUsedVersion", latestVersion);

    const latestVersionHeader = changelogOverlay.inner.find("h2")[0];
    latestVersionHeader.innerText += " -- NEW!";
    latestVersionHeader.style.color = "red";

    changelogOverlay.showButton.trigger("click");
}

