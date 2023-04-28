let itemsPerRow = 8;
let textListSeparatorSelectedRadio = 0; // , textListCustomSeparator = "";

let itemsPerRowSlider, itemsPerRowLabel, itemNameInput, itemQuantityInput, itemPriceOrMultiplierInput, itemTable;
let bottomText, screenshotRegion;
let settingsButton, settingsOverlay, hideSettingsButton, abbreviationMappingTable, bottomTextSettingInput, textListSeparatorRadios, textListCustomSeparatorInput, textListSeparatorCustomRadio, textListFormatInput, priceCalculationItemInput;
let priceCalculationModeStateSpan;
let disableInPriceCalculationModeElems, disableOutsidePriceCalculationModeElems;
let equationVisibilityStateSpan;
let totalPriceArea, totalPriceHolder, totalPriceMessageHolder, totalPriceEquationHolder;
let coinImageUrl;
let priceCalculationItem;
let priceCalculationModeSelectionInfo;
let changelogButton, changelogOverlay, changelogInner;

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

    settingsButton = $("#settingsButton");
    settingsOverlay = $("#settingsOverlay");
    hideSettingsButton = $("#hideSettingsButton");
    abbreviationMappingTable = $("#abbreviationMappingTable");
    bottomTextSettingInput = $("#bottomTextSettingInput");
    textListSeparatorRadios = $("input[name='textListSeparatorGroup']");
    textListCustomSeparatorInput = $("#textListCustomSeparatorInput");
    textListSeparatorCustomRadio = $("#textListSeparatorCustomRadio");
    textListFormatInput = $("#textListFormatInput");
    priceCalculationItemInput = $("#priceCalculationItemInput");

    priceCalculationModeStateSpan = $("#priceCalculationModeStateSpan");

    disableInPriceCalculationModeElems = $(".disableInPriceCalculationMode");
    disableOutsidePriceCalculationModeElems = $(".disableOutsidePriceCalculationMode");

    equationVisibilityStateSpan = $("#equationVisibilityStateSpan");

    totalPriceArea = $("#totalPriceArea");
    totalPriceHolder = $("#totalPriceHolder");
    totalPriceMessageHolder = $("#totalPriceMessageHolder");
    totalPriceEquationHolder = $("#totalPriceEquationHolder");

    priceCalculationModeSelectionInfo = $("#priceCalculationModeSelectionInfo");

    changelogButton = $("#changelogButton");
    changelogOverlay = $("#changelogOverlay");
    changelogInner = $("#changelogInner");


    itemsPerRowSlider.on("input",
        (event) =>
        {
            itemsPerRow = event.target.value;
            itemsPerRowLabel.text(itemsPerRow);
            updateItemLayout();
        }
    );

    itemNameInput.on("keyup", handleAddingItem);
    itemQuantityInput.on("keyup", handleAddingItem);
    itemPriceOrMultiplierInput.on("keyup", handleAddingItem);


    const coinImagePromise = getImageUrl("Coin", 28)
        .then(imageUrl => coinImageUrl = imageUrl)
        .catch(e => console.log("Failed to get coin image url --", e));

    $("#copyImageToClipboardButton").on("click", copyImageToClipboard);


    // TODO -- I might want to eventually move this css stuff to a class, then use classList to add/remove these classes from the respective elements?  https://developer.mozilla.org/en-US/docs/Web/API/Element/classList
    settingsButton.on("click", () =>
    {
        settingsOverlay.prop("hidden", false);
        // disables scrolling the main page and removes the scrollbar from the side while the settings button is focused ( https://stackoverflow.com/questions/9280258/prevent-body-scrolling-but-allow-overlay-scrolling )
        $("body").css("overflow", "hidden");
    });
    hideSettingsButton.on("click", () =>
    {
        settingsOverlay.prop("hidden", true);
        $("body").css("overflow", "visible");
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
        updateBottomTextWidth();
    });
    // on change for when focus is lost to the input area, which "commits" the changes to local storage as well
    bottomTextSettingInput.change(event =>
    {
        bottomText[0].innerText = event.target.value;
        updateBottomTextWidth();

        saveAllToLocalStorage();
    });
    bottomText.on("click", () =>
    {
        settingsButton.click();
        bottomTextSettingInput.select();
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
        $(elem).click(i, (event) =>
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

    textListFormatInput.change(() =>
    {
        saveAllToLocalStorage();
    });

    priceCalculationItemInput.change(async (event) =>
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

        updateTotalPrice();
        saveAllToLocalStorage();
    });
    // want to make it fire immediately the first time; I couldn't do this inside the load all function since this must be set after the load all and after the coin image url is fetched
    priceCalculationItemInput.change();

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
        totalPriceArea.prop("hidden", wasEnabled);
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

    $("#selectAllButton").click(() =>
    {
        const cells = $("#itemTable td");
        setSelectedStateAll(items.values(), cells, true);

        updateTotalPrice();
    });

    $("#clearSelectionButton").click(() =>
    {
        const cells = $("#itemTable td");
        setSelectedStateAll(items.values(), cells, false);

        updateTotalPrice();
    });

    $("#subtractSelectedQuantitiesButton").click(() =>
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

    $("#deleteSelectedButton").click(() =>
    {
        for(let item of items.values())
        {
            if(item.isSelected)
                items.delete(item.name);
        }

        updateItemLayout();

        saveAllToLocalStorage();
    });

    $("#resetCustomValuesButton").click(() =>
    {
        for(let item of items.values())
        {
            item.customQuantity = undefined;
            item.customPriceOrMultiplier = undefined;
        }

        updateItemLayout();
    });

    $("#equationVisibilityToggleButton").click(() =>
    {
        // TODO - might want to use something like this for the price calculation toggle, since it can be tied to the total price div area
        const wasHidden = totalPriceEquationHolder.is("[hidden]");

        equationVisibilityStateSpan.text(wasHidden ? "Hide" : "Show");
        totalPriceEquationHolder.prop("hidden", !wasHidden);
    });




    setUpChangelog();

    changelogButton.on("click", () =>
    {
        changelogOverlay.prop("hidden", false);
        // disables scrolling the main page and removes the scrollbar from the side while the settings button is focused ( https://stackoverflow.com/questions/9280258/prevent-body-scrolling-but-allow-overlay-scrolling )
        $("body").css("overflow", "hidden");
    });

    $("#hideChangelogButton").on("click", () =>
    {
        changelogOverlay.prop("hidden", true);
        $("body").css("overflow", "visible");
    });

    handleVersionChange();
});

// There are more operators than the ones here technically supported by math.js, but I feel like these are all the "reasonable" ones to support for the automatic prepending of the old quantity/custom quantity ( https://mathjs.org/docs/expressions/syntax.html )
const operators = ['+', '-', '*', '/', '^', '%', "mod", '&', '|', "<<", ">>>", ">>"]; // >>> should be before >> to ensure the full operator gets removed then readded later (if >> was first, ">>> 5" would only remove the first 2 '>' leaving "> 5")
function handleAddingItem(e)
{
    // only want the name box to have the invalid red border until the user starts typing again (tabbing into this textbox also cancels it; unfortunately, this gets removed almost immediately if the user starts typing right after pressing enter, since it takes a bit of time for the fetch to occur and for the invalid class to be added, if needed)
    if(itemNameInput.hasClass("invalid"))
        itemNameInput.removeClass("invalid");

    if(e.code !== "Enter")
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
    static fieldsToOmitFromLocalStorage = ["customQuantity", "customPriceOrMultiplier", "isSelected"];
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


let items = new Map();
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


function getImageUrl(itemNameTitleSnakeCase, imageWidth = 100)
{
    // https://www.mediawiki.org/wiki/API:Imageinfo
    return fetch(`https://hayday.fandom.com/api.php?action=query&prop=imageinfo&iiprop=url&titles=File:${itemNameTitleSnakeCase}.png&iiurlwidth=${imageWidth}&format=json&origin=*`)
        .then(response => response.json())
        .then(data =>
        {
            // console.log(data);
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
            // for some reason, this works fine but the resultant wikia static image url yields a 404 from github pages ONLY when scaled down
            // return pages[pageId].imageinfo[0].thumburl;
            return pages[pageId].imageinfo[0].thumburl.split("\/revision\/latest\/scale-to-width-down")[0];
        });

}

let previousSelection;
function updateItemLayout()
{
    itemTable.empty();

    if(!items.size)
        return;

    const itemsSortedDescending = [...items.values()].sort((item1, item2) => item2.quantity - item1.quantity);

    const itemCt = itemsSortedDescending.length;
    let rowCt = Math.ceil(itemCt / itemsPerRow);

    const shouldShowSelection = getIsInPriceCalculationMode();
    previousSelection = undefined;

    let i = 0;
    let imageLoadPromises = [];
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
            $(tableCell).mouseup({index: i, item: currItem}, (event) =>
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
            image.className = "itemImage";
            imageLoadPromises.push(new Promise(resolve => $(image).on("load", resolve)));
            $(image).on("click", () =>
            {
                itemNameInput.select();
            });

            const quantityLabel = document.createElement("p");
            quantityLabel.innerText = currItem.quantity;
            quantityLabel.className = "quantityLabel";
            $(quantityLabel).on("click", () =>
            {
                itemQuantityInput.select();
            });

            const priceLabel = document.createElement("p");
            priceLabel.innerHTML = formatItemPriceLabel(currItem.priceOrMultiplier); // using innerHTML so that coin image is shown
            priceLabel.className = "priceLabel";
            $(priceLabel).on("click", () =>
            {
                itemPriceOrMultiplierInput.select();
            });

            let customQuantityLabel, customPriceLabel;
            if(shouldShowSelection)
            {
                if(currItem.customQuantity !== undefined)
                {
                    customQuantityLabel = document.createElement("p");
                    customQuantityLabel.innerText = currItem.customQuantity;
                    customQuantityLabel.className = "customQuantityLabel";
                    customQuantityLabel.hidden =  !currItem.isSelected;
                    $(customQuantityLabel).on("click", () =>
                    {
                        itemQuantityInput.select();
                    });
                }

                if(currItem.customPriceOrMultiplier !== undefined)
                {
                    customPriceLabel = document.createElement("p");
                    customPriceLabel.innerHTML = formatItemPriceLabel(currItem.customPriceOrMultiplier); // using innerHTML so that coin image is shown
                    customPriceLabel.className = "customPriceLabel";
                    customPriceLabel.hidden =  !currItem.isSelected;
                    $(customPriceLabel).on("click", () =>
                    {
                        itemPriceOrMultiplierInput.select();
                    });
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

    if(shouldShowSelection)
        updateTotalPrice();

    // wait for all images to load, then update width of bottom text
    Promise.all(imageLoadPromises).then(updateBottomTextWidth);
}

function formatItemPriceLabel(priceOrMultiplier)
{
    const priceStr = String(priceOrMultiplier);
    const priceStrTrimmed = priceStr.trim();
    return priceOrMultiplier + (!priceStrTrimmed.length || priceStrTrimmed.endsWith('x') ? "" : `<img class="coin" src="${coinImageUrl}">`);
}


let isActivelyCopyingImage = false;
function copyImageToClipboard()
{
    if(isActivelyCopyingImage)
        return;
    isActivelyCopyingImage = true;

    const createdBy = document.createElement("p");
    // for those of you reading this, I would appreciate if this doesn't get removed from the generated image
    createdBy.innerText = "Tool Created by JJCUBER";
    createdBy.style.textAlign = "right";
    createdBy.style.fontSize = "10px";
    createdBy.style.margin = "10px";
    createdBy.style.marginTop = "2px";
    createdBy.style.fontWeight = "900";
    screenshotRegion.append(createdBy);

    htmlToImage.toBlob(screenshotRegion[0])
        .then(blob => new ClipboardItem({"image/png": blob}))
        .then(clipboardItem => navigator.clipboard.write([clipboardItem]))
        .catch(e =>
        {
            console.log("Unable to generate image and/or copy it to clipboard --", e);

            // I might want to eventually catch right after toBlob() and do the above, then catch here to have a fallback of showing the image on screen for the user to save (or prompt to download).
        })
        .finally(() =>
        {
            $(createdBy).remove();
            isActivelyCopyingImage = false;
        });

}


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

    const sItemsPerRow = localStorage.getItem("itemsPerRow") ?? 8; // default 8
    itemsPerRowSlider.val(sItemsPerRow);
    itemsPerRowLabel.text(sItemsPerRow);
    itemsPerRow = sItemsPerRow;

    textListSeparatorSelectedRadio = localStorage.getItem("textListSeparatorSelectedRadio") ?? 0;
    const sTextListCustomSeparator = localStorage.getItem("textListCustomSeparator") ?? "";
    textListSeparatorCustomRadio.val(sTextListCustomSeparator);
    textListCustomSeparatorInput.val(sTextListCustomSeparator);

    const sTextListFormat = localStorage.getItem("textListFormat") ?? "{{quantity}} {{name}} ({{price}})"; // default format on right
    textListFormatInput.val(sTextListFormat);

    const sPriceCalculationItem = localStorage.getItem("priceCalculationItem") ?? "Diamond Ring"; // default to rings
    priceCalculationItemInput.val(sPriceCalculationItem);
}

function saveAllToLocalStorage()
{
    // console.log("Saved");
    saveItemsToLocalStorage();
    localStorage.setItem("abbreviationMapping", JSON.stringify([...abbreviationMapping]));
    localStorage.setItem("bottomText", bottomText[0].innerText); // must use innerText for newlines to be handled properly
    // localStorage.setItem("bottomText", bottomTextSettingInput.val()); // can just use the setting input's value instead, though maybe I should keep it consistent with the loadAll, due to the way I load it into the bottom text then into the setting
    localStorage.setItem("itemsPerRow", itemsPerRowSlider.val());
    localStorage.setItem("textListSeparatorSelectedRadio", textListSeparatorSelectedRadio);
    localStorage.setItem("textListCustomSeparator", textListCustomSeparatorInput.val());
    localStorage.setItem("textListFormat", textListFormatInput.val());
    localStorage.setItem("priceCalculationItem", priceCalculationItemInput.val());
}

function saveItemsToLocalStorage()
{
    localStorage.setItem("items", JSON.stringify([...items], (key, value) => Item.fieldsToOmitFromLocalStorage.includes(key) ? undefined : value));
}


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
    $(abbreviationInput).change(handleAbbreviationChange);
    abbreviationInput.value = abbreviation;
    abbreviationInput.dataset.previousValue = abbreviation;
    const abbreviationExpandedInput = document.createElement("input");
    $(abbreviationExpandedInput).change(handleAbbreviationChange);
    abbreviationExpandedInput.value = abbreviationExpanded;
    // abbreviationExpandedInput.dataset.previousValue = abbreviationExpanded;


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


function copyAsTextListToClipboard()
{
    const itemStrs = [];

    const format = textListFormatInput.val();
    const itemsSortedDescending = [...items.values()].sort((item1, item2) => item2.quantity - item1.quantity);
    for(let item of itemsSortedDescending)
        itemStrs.push(formatTextListItem(format, item));

    const textList = itemStrs.join(textListSeparatorRadios[textListSeparatorSelectedRadio].value);
    navigator.clipboard.writeText(textList);
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
        if(getIsInPriceCalculationMode())
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
    // we go through it in quantity descending order to make the equation be in the same order as the items in the grid
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

    if(message === undefined)
        totalPriceMessageHolder.prop("hidden", true);
    else
    {
        totalPriceMessageHolder.text(message);
        totalPriceMessageHolder.css("color", isError ? "red" : "purple");

        totalPriceMessageHolder.prop("hidden", false);
    }

    // console.log(equations.join(" + "));
    totalPriceEquationHolder.text(equations.join(" + "));

    return total;
}

// it might be better to check whether in price calculation mode here instead of everywhere before calling this function, though that might be slower in scenarios where I have the state (of whether being in price calculation mode or not) cached.
function updateTotalPrice()
{
    const totalPrice = calculateTotalSelectedPrice();
    const totalPriceFormatted = totalPrice.toLocaleString();

    // hasn't loaded yet
    if(!priceCalculationItem)
        return;

    const totalPriceInItems = +(totalPrice / priceCalculationItem.maxPrice).toFixed(2); // the unary + converts it back to a number, removing trailing zeroes
    const totalPriceInItemsFormatted = totalPriceInItems.toLocaleString();

    totalPriceHolder.html(`${totalPriceFormatted}<img src="${coinImageUrl}" style="width: 14px; height: 14px;"><span style="display: inline-block; width: 10px;"></span>${totalPriceInItems}<img src="${priceCalculationItem.url}" style="width: 14px; height: 14px;">`);
}



function updateBottomTextWidth()
{
    bottomText.width("auto");
    // this preserves the entire formatting of the message since it is multiline (I couldn't find a good way to allow wrapping; setting the screenshot region's width to the itemtable's width temporarily to try and make the text wrap causes the bottom text's .width() to return the width that the parent screenshot region was set to, instead of its own true width)
    const properWidth = Math.max(itemTable.width(), bottomText.width());
    bottomText.width(`${properWidth}px`);
}


function getIsInPriceCalculationMode()
{
    return !totalPriceArea.is("[hidden]");
}


function setSelectedState(item, cell, isSelected)
{
    item.isSelected = isSelected;

    if(isSelected)
        cell.classList.add("selected");
    else
        cell.classList.remove("selected");

    $(cell).find(".customQuantityLabel,.customPriceLabel").prop("hidden", !isSelected);
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

        $(cell).find(".customQuantityLabel,.customPriceLabel").prop("hidden", !isSelected);
    }
}

const changelog = new Map([
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
    changelogInner.append(changes.flatMap(elem => [elem, document.createElement("hr")]).slice(0, -1));
}

function handleVersionChange()
{
    const latestVersion = changelog.keys().next().value;
    const sLastUsedVersion = localStorage.getItem("lastUsedVersion");

    if(sLastUsedVersion === latestVersion)
        return;

    localStorage.setItem("lastUsedVersion", latestVersion);

    const latestVersionHeader = changelogInner.find("h2")[0];
    latestVersionHeader.innerText += " -- NEW!";
    latestVersionHeader.style.color = "red";

    changelogButton.click();
}

