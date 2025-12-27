import { Brainrot, BrainrotInventory } from "./Database/interfaces";

export function addBrainrot(brainrot: Brainrot, inventory: BrainrotInventory[]): BrainrotInventory[] {
    const brainrotFound = inventory.find(br => br.id == brainrot.id);

    if (brainrotFound) {
        brainrotFound.amount++;

        inventory = inventory.filter(br => br.id != brainrot.id);
        inventory.push(brainrotFound);
    } else inventory.push({ id: brainrot.id, amount: 1 });

    return inventory;
}