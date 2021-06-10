export function getInput(id: string)
{
    const $element = document.getElementById(id);

    if ($element instanceof HTMLInputElement)
    {
        return $element;
    }

    throw new Error(`#${id} is not HTMLInputElement`);
}

export function getButton(id: string)
{
    const $element = document.getElementById(id);

    if ($element instanceof HTMLButtonElement)
    {
        return $element;
    }

    throw new Error(`#${id} is not HTMLButtonElement`);
}

export function getSelect(id: string)
{
    const $element = document.getElementById(id);

    if ($element instanceof HTMLSelectElement)
    {
        return $element;
    }

    throw new Error(`#${id} is not HTMLSelectElement`);
}

export function onReady(callback: Function)
{
    document.addEventListener("DOMContentLoaded", () =>
    {
        callback();
    });
}
