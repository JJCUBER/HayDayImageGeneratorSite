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

