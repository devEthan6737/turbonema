import { Brainrot, BrainrotInventory } from "./Database/interfaces";

export function addBrainrot (brainrotId: Brainrot['id'], inventory: BrainrotInventory[]): BrainrotInventory[] {
    const index = inventory.findIndex(item => item.id === brainrotId);

    if (index === -1) return [...inventory, { id: brainrotId, amount: 1, protectedUntil: undefined }];

    return inventory.map((item, i) => i === index? { ...item, amount: item.amount + 1 } : item);
}

export function removeBrainrot (brainrotId: Brainrot['id'], inventory: BrainrotInventory[]): BrainrotInventory[] {
    return inventory.flatMap(item => {
        if (item.id !== brainrotId) return item;
        if (item.amount > 1) return { ...item, amount: item.amount - 1 };

        return [];
  });
}

export function findBrainrot (brainrotId: Brainrot['id'], inventory: BrainrotInventory[]): BrainrotInventory | undefined {
    return inventory.find(brainrot => brainrot.id == brainrotId);
}