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

    if(shouldShowSelection)
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
    // TODO -- I should instead filter this BEFORE sorting (doesn't change anything functionally, it's just more performant that way)
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

    const hasMessage = message !== undefined;
    if(hasMessage)
    {
        totalPriceMessageHolder.text(message);
        totalPriceMessageHolder.css("color", isError ? "red" : "purple");
    }
    totalPriceMessageHolder.prop("hidden", !hasMessage);

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

    const selectedCount = getSelectedCount();

    totalPriceHolder.html(`${totalPriceFormatted}<img src="${coinImageUrl}" style="width: 14px; height: 14px;"><span style="display: inline-block; width: 10px;"></span>${totalPriceInItems}<img src="${priceCalculationItem.url}" style="width: 14px; height: 14px;"><span style="display: inline-block; width: 10px;"></span>(${selectedCount} items)`);
}


function getIsInPriceCalculationMode()
{
    return !totalPriceArea.is("[hidden]");
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

function getSelectedCount()
{
    let count = 0;
    for(let item of [...items.values()])
    {
        if(item.isSelected)
            count += item.customQuantity ?? item.quantity;
    }

    return count;
}

