let itemsPerRow = 8;

let itemsPerRowSlider, itemsPerRowLabel, itemNameInput, itemQuantityInput, itemPriceOrMultiplierInput, itemTable, bottomText, screenshotRegion, settingsButton, settingsOverlay, hideSettingsButton, abbreviationMappingTable, bottomTextSettingInput;
let coinImageUrl;
$(document).ready(() =>
{
    itemsPerRowSlider = $("#itemsPerRowSlider");
    itemsPerRowLabel = $("#itemsPerRowLabel");
    itemNameInput = $("#itemNameInput");
    itemQuantityInput = $("#itemQuantityInput");
    itemPriceOrMultiplierInput = $("#itemPriceOrMultiplierInput");
    itemTable = $("#itemTable");


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


    bottomText = $("#bottomText");

    const coinImagePromise = getImageUrl("Coin", 28)
        .then(imageUrl => coinImageUrl = imageUrl)
        .catch(e => console.log("Failed to get coin image url --", e));

    screenshotRegion = $("#screenshotRegion");
    $("#copyImageToClipboardButton").on("click", copyImageToClipboard);


    settingsButton = $("#settingsButton");
    settingsOverlay = $("#settingsOverlay");
    hideSettingsButton = $("#hideSettingsButton");

    settingsButton.on("click", () =>
    {
        settingsOverlay.css("display", "block");
    });
    hideSettingsButton.on("click", () =>
    {
        settingsOverlay.css("display", "none");
    });


    loadAllFromLocalStorage();
    // want to update the layout after loading from local storage, but only after the coin image has loaded
    coinImagePromise.then(() =>
    {
        updateItemLayout();
    });

    abbreviationMappingTable = $("#abbreviationMappingTable");
    setUpAbbreviationMappingTable();

    bottomTextSettingInput = $("#bottomTextSettingInput");
    bottomTextSettingInput.val(bottomText.text());
    bottomTextSettingInput.change(event =>
    {
        bottomText.text(event.target.value);

        saveAllToLocalStorage();
    });


    // (only fires once the slider is released)
    itemsPerRowSlider.on("change", () =>
    {
        saveAllToLocalStorage();
    });
});

function handleAddingItem(e)
{
    if(e.code !== "Enter")
        return;

    const itemNameFormatted = formatItemName(itemNameInput.val());
    if(!itemNameFormatted.length)
        return;

    let itemQuantity;
    try
    {
        itemQuantity = math.evaluate(`floor(${itemQuantityInput.val()})`);
    }
    catch(e)
    {
        console.log("Unable to evaluate quantity --", e);
        return;
    }

    addItem(itemNameFormatted, itemQuantity, itemPriceOrMultiplierInput.val())
        .then(() => updateItemLayout())
        .catch(e => console.log("Failed to add item and update layout --", e));

    itemNameInput.val("");
    itemQuantityInput.val(1);
    itemPriceOrMultiplierInput.val("5x");
}


class Item
{
    constructor(name, quantity, url, priceOrMultiplier)
    {
        this.name = name;
        this.quantity = quantity;
        this.url = url;
        this.priceOrMultiplier = priceOrMultiplier;
    }
}


let items = new Map();
function addItem(itemNameFormatted, itemQuantity, itemPriceOrMultiplier)
{
    if(items.has(itemNameFormatted))
    {
        if(itemQuantity > 0)
        {
            const currItem = items.get(itemNameFormatted);
            currItem.quantity = itemQuantity;
            currItem.priceOrMultiplier = itemPriceOrMultiplier;
        }
        else
            items.delete(itemNameFormatted);

        saveAllToLocalStorage();

        return Promise.resolve();
    }

    if(itemQuantity <= 0)
        return Promise.resolve();

    return getImageUrl(itemNameFormatted)
        .then(imageUrl =>
        {
            console.log(imageUrl);

            items.set(itemNameFormatted, new Item(itemNameFormatted, itemQuantity, imageUrl, itemPriceOrMultiplier));

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

const specialNameMapping = new Map([
    ["Tnt_Barrel", "TNT_Barrel"]
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

function updateItemLayout()
{
    itemTable.empty();

    if(!items.size)
        return;

    const itemsSortedDescending = [...items.values()].sort((item1, item2) => item2.quantity - item1.quantity);

    const itemCt = itemsSortedDescending.length;
    let rowCt = Math.ceil(itemCt / itemsPerRow);

    let i = 0;
    let imageLoadPromises = [];
    while(rowCt--)
    {
        const tableRow = document.createElement("tr");
        for(let j = 0; i < itemCt && j < itemsPerRow; i++, j++)
        {
            const tableCell = document.createElement("td");
            tableCell.className = "itemCell";
            // must be mouseup to execut before the on click events for image, quantity, and label (since they must select the text after it has been overridden by this)
            $(tableCell).mouseup(itemsSortedDescending[i], (event) =>
                {
                    const item = event.data;
                    itemNameInput.val(item.name.replaceAll("_", " "));
                    itemQuantityInput.val(item.quantity);
                    itemPriceOrMultiplierInput.val(item.priceOrMultiplier);
                }
            );

            const image = document.createElement("img");
            image.src = itemsSortedDescending[i].url;
            image.className = "itemImage";
            imageLoadPromises.push(new Promise(resolve => $(image).on("load", resolve)));
            $(image).on("click", () =>
            {
                itemNameInput[0].select();
            });

            const quantityLabel = document.createElement("p");
            quantityLabel.innerText = itemsSortedDescending[i].quantity;
            quantityLabel.className = "quantityLabel";
            $(quantityLabel).on("click", () =>
            {
                itemQuantityInput[0].select();
            });

            const priceLabel = document.createElement("p");
            priceLabel.innerHTML = formatItemPriceLabel(itemsSortedDescending[i].priceOrMultiplier); // using innerHTML so that coin image is shown
            priceLabel.className = "priceLabel";
            $(priceLabel).on("click", () =>
            {
                itemPriceOrMultiplierInput[0].select();
            });

            tableCell.appendChild(image);
            tableCell.appendChild(quantityLabel);
            tableCell.appendChild(priceLabel);

            tableRow.appendChild(tableCell);
        }

        itemTable.append(tableRow);
    }

    // wait for all images to load, then update width of big message
    Promise.all(imageLoadPromises).then(() => bottomText.attr("style", `width: ${itemTable.width()}px;`));
}

function formatItemPriceLabel(priceOrMultiplier)
{
    return priceOrMultiplier + (String(priceOrMultiplier).endsWith('x') ? "" : `<img id="coin" src="${coinImageUrl}">`);
}


function copyImageToClipboard()
{
    const createdBy = document.createElement("p");
    // for those of you reading this, I would appreciate if this doesn't get removed from the generated image
    createdBy.innerText = "Tool Created by JJCUBER";
    createdBy.style.textAlign = "right";
    createdBy.style.fontSize = "10px";
    createdBy.style.margin = "10px";
    createdBy.style.marginTop = "2px";
    screenshotRegion.append(createdBy);

    htmlToImage.toBlob(screenshotRegion[0])
        .then((blob) =>
        {
            $(createdBy).remove();
            return blob;
        })
        .then(blob => new ClipboardItem({"image/png": blob}))
        .then(clipboardItem => navigator.clipboard.write([clipboardItem]));

}


function loadAllFromLocalStorage()
{
    const sItems = localStorage.getItem("items");
    if(sItems)
        items = new Map(JSON.parse(sItems));

    const sAbbreviationMapping = localStorage.getItem("abbreviationMapping");
    if(sAbbreviationMapping)
        abbreviationMapping = new Map(JSON.parse(sAbbreviationMapping));

    const sBottomText = localStorage.getItem("bottomText");
    bottomText.text(sBottomText ?? "Partials Accepted"); // just like the abbreviations, I give a "reasonable" default

    const sItemsPerRow = localStorage.getItem("itemsPerRow") ?? 8; // default 8
    itemsPerRowSlider.val(sItemsPerRow);
    itemsPerRowLabel.text(sItemsPerRow);
    itemsPerRow = sItemsPerRow;
}

function saveAllToLocalStorage()
{
    // console.log("Saved");
    localStorage.setItem("items", JSON.stringify([...items]));
    localStorage.setItem("abbreviationMapping", JSON.stringify([...abbreviationMapping]));
    localStorage.setItem("bottomText", bottomText.text());
    localStorage.setItem("itemsPerRow", itemsPerRowSlider.val());
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

