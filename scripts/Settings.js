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

// TODO -- double check to make sure that there are no issues arising when in price calculation mode while importing
function exportAll()
{
    let blob = new Blob([JSON.stringify(JSON.stringify(localStorage))], {type: "application/json"}); // need to do it twice to get double quotes properly escaped

    let aElement = document.createElement("a");
    aElement.href = URL.createObjectURL(blob);
    aElement.download = `Full Export -- ${(new Date()).toISOString()}.json`;
    aElement.hidden = true;
    document.body.appendChild(aElement);

    aElement.click();
    aElement.remove();
}

function importAll(jsonBlob)
{
    const json = JSON.parse(JSON.parse(jsonBlob));
    // TODO -- should I be wiping local storage entirely before doing this?  (Basically, should I force all "missing" settings from this imported json to be defaulted to whatever value it should have, or should I leave those missing settings the same as how they currently are?)
    for(let [key, value] of Object.entries(json))
        localStorage.setItem(key, value);

    loadAllFromLocalStorage();
    updateItemLayout();
}

// Both settings directly pertaining to item lists are excluded since it is confusing to have them also be tied to item lists.
const excludeFromItemLists = ["activeItemList", "itemLists", "includeSettingsInItemList", "copyCurrentItemsFromItemList", "lastUsedVersion", "v2.14_backup"];
function createItemListObject(shouldIncludeItems)
{
    let obj = {};
    if(shouldIncludeSettingsInItemList)
    {
        // grab everything (other than excluded)
        obj = {...localStorage};
        for(let key of excludeFromItemLists)
            delete obj[key];
    }
    // grab items if allowed
    obj.items = shouldIncludeItems ? localStorage.items : JSON.stringify([]);

    return obj;
}

function createNewItemList(name)
{
    const obj = createItemListObject(shouldCopyCurrentItemsFromItemList || name === "Default");

    activeItemList = name;
    deleteItemListButton.prop("disabled", activeItemList === "Default");

    const option = new Option(activeItemList);
    itemListDropdown.append(option);
    $(option).prop("selected", true);

    itemLists.set(activeItemList, obj);
}

function storeItemList()
{
    const obj = createItemListObject(true);
    itemLists.set(activeItemList, obj);

    saveAllToLocalStorage();
}

function loadItemList()
{
    // Need to save first to make sure information on the active item list is up to date (including the data within itemLists itself).
    saveAllToLocalStorage();

    // update local storage where relevant
    const obj = itemLists.get(activeItemList);
    for(let key of Object.keys(obj))
        localStorage[key] = obj[key];

    // load in changes made to local storage (this also makes the Create button disabled, as desired)
    loadAllFromLocalStorage();
    updateItemLayout();
}

