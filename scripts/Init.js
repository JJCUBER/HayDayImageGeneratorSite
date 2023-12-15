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
    hidePriceOrMultiplierCheckBox = $("#hidePriceOrMultiplierCheckBox");
    defaultQuantityInput = $("#defaultQuantityInput");
    defaultPriceOrMultiplierInput = $("#defaultPriceOrMultiplierInput");
    refocusNameOnSubmitCheckBox = $("#refocusNameOnSubmitCheckBox");
    ignoreLocaleCheckBox = $("#ignoreLocaleCheckBox");
    // reduceAnimationsCheckBox = $("#reduceAnimationsCheckBox");


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
        {
            // done to be consistent with Submit; clicking Submit reselects the name field even when it is empty (when this setting is enabled)
            if(shouldRefocusNameOnSubmit)
                itemNameInput.trigger("select");

            return;
        }

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


    // TODO -- should I be using change event instead of click event for checkboxes (along with any input element variants)?  Resources such as https://stackoverflow.com/questions/3442322/jquery-checkbox-event-handling make it sound like click doesn't work for certain things, but they do seem to (which is likely due to how old this so question is).  This resource seems to better explain; in my use case, they are pretty much identical, though there is a potential distinction: https://stackoverflow.com/questions/11205957/jquery-difference-between-change-and-click-event-of-checkbox
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

    hidePriceOrMultiplierCheckBox.on("click", () =>
    {
        shouldHidePriceOrMultiplier = !shouldHidePriceOrMultiplier;

        updateItemLayout();
        saveAllToLocalStorage();
    });

    defaultQuantityInput.on("change", (event) =>
    {
        // TODO -- should this instead be set within saveAllToLocalStorage()?  Probably not...
        defaultQuantity = event.target.value;

        saveAllToLocalStorage();
    });
    defaultPriceOrMultiplierInput.on("change", (event) =>
    {
        // TODO -- should this instead be set within saveAllToLocalStorage()?  Probably not...
        defaultPriceOrMultiplier = event.target.value;

        saveAllToLocalStorage();
    });
    refocusNameOnSubmitCheckBox.on("click", () =>
    {
        shouldRefocusNameOnSubmit = !shouldRefocusNameOnSubmit;

        saveAllToLocalStorage();
    });
    ignoreLocaleCheckBox.on("click", () =>
    {
        shouldIgnoreLocale = !shouldIgnoreLocale;

        updateTotalPrice();
        saveAllToLocalStorage();
    });
    // reduceAnimationsCheckBox.on("click", () =>
    // {
    //     // TODO -- figure out how to disable animations and transitions via js; I don't see a good way currently
    // });

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

