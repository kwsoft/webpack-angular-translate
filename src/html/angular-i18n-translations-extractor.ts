import {AngularElement, HtmlTranslationExtractionContext} from "./html-translation-extractor";
import {Attribute} from "./element-context";

const I18N_ATTRIBUTE_REGEX = /^i18n-.*$/;
const I18N_ATTRIBUTE_NAME = "i18n";
const ID_INDICATOR = "@@";

export default function angularI18nTranslationsExtractor(
    element: AngularElement,
    context: HtmlTranslationExtractionContext
): void {
    const i18nElementTranslation = element.attributes.find(attribute => attribute.name === I18N_ATTRIBUTE_NAME);

    if (i18nElementTranslation) {
        handleTranslationsOfElements(element, context, i18nElementTranslation);
    }

    const i18nAttributeTranslation = element.attributes.filter(attribute => I18N_ATTRIBUTE_REGEX.test(attribute.name));

    handleTranslationsOfAttributes(element, context, i18nAttributeTranslation);
}

function handleTranslationsOfElements(
    element: AngularElement,
    context: HtmlTranslationExtractionContext,
    attribute: Attribute
): void {
    const translationId = extractTranslationId(attribute, context);

    let defaultTranslation: string;
    if (element.texts.length > 0 && translationId) {
        defaultTranslation = element.texts[0].text;
        context.registerTranslation({
            translationId: translationId,
            defaultText: defaultTranslation,
            position: element.startPosition
        });
    } else {
        context.emitError(`The element ${context.asHtml()} with attribute  ${attribute.name} is empty and is therefore missing the default translation.`, attribute.startPosition);
    }
}

function handleTranslationsOfAttributes(
    element: AngularElement,
    context: HtmlTranslationExtractionContext,
    i18nAttributes: Attribute[]
): void {

    for (const i18nAttribute of i18nAttributes) {
        const translationId = extractTranslationId(i18nAttribute, context);
        const attributeName = i18nAttribute.name.substr(`${I18N_ATTRIBUTE_NAME}-`.length);
        const attribute = element.attributes.find(attribute => attribute.name === attributeName);

        if (!attribute) {
            context.emitError(`The element ${context.asHtml()} with ${i18nAttribute.name} is missing a corresponding ${attributeName} attribute.`, element.startPosition);
        }

        const defaultText = attribute ? attribute.value : undefined;

        if (!defaultText) {
            context.emitError(`The element ${context.asHtml()} with ${i18nAttribute.name} is missing a value for the corresponding ${attributeName} attribute.`, element.startPosition);
        }

        if (translationId && attribute && defaultText) {
            context.registerTranslation({
                translationId: translationId,
                defaultText: defaultText,
                position: i18nAttribute.startPosition
            });
        }
    }
}

function extractTranslationId(attribute: Attribute, context: HtmlTranslationExtractionContext): string {
    const index = attribute.value.indexOf(ID_INDICATOR);
    if (index < 0) {
        context.emitError(`The attribute ${attribute.name} on element ${context.asHtml()} attribute is missing the custom id indicator '${ID_INDICATOR}'.`, attribute.startPosition);
    } else if (index + ID_INDICATOR.length === attribute.value.length) {
        context.emitError(`The attribute ${attribute.name} on element ${context.asHtml()} defines an empty ID.`, attribute.startPosition);
    } else {
        return attribute.value.substr(index + ID_INDICATOR.length);
    }
}