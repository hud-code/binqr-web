import { Box, Location } from "./types";

const BOXES_STORAGE_KEY = 'binqr_boxes';
const LOCATIONS_STORAGE_KEY = 'binqr_locations';

// Box storage functions
export const getStoredBoxes = (): Box[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(BOXES_STORAGE_KEY);
    if (!stored) return [];
    
    const boxes = JSON.parse(stored);
    // Convert date strings back to Date objects
    return boxes.map((box: Box & { createdAt: string; updatedAt: string }) => ({
      ...box,
      createdAt: new Date(box.createdAt),
      updatedAt: new Date(box.updatedAt)
    }));
  } catch (error) {
    console.error('Error loading boxes from storage:', error);
    return [];
  }
};

export const saveBox = (box: Box): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const boxes = getStoredBoxes();
    const existingIndex = boxes.findIndex(b => b.id === box.id);
    
    if (existingIndex >= 0) {
      boxes[existingIndex] = box;
    } else {
      boxes.push(box);
    }
    
    localStorage.setItem(BOXES_STORAGE_KEY, JSON.stringify(boxes));
  } catch (error) {
    console.error('Error saving box to storage:', error);
  }
};

export const deleteBox = (boxId: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const boxes = getStoredBoxes();
    const filtered = boxes.filter(box => box.id !== boxId);
    localStorage.setItem(BOXES_STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting box from storage:', error);
  }
};

export const getBoxByQRCode = (qrCode: string): Box | null => {
  const boxes = getStoredBoxes();
  return boxes.find(box => box.qrCode === qrCode) || null;
};

// Location storage functions
export const getStoredLocations = (): Location[] => {
  if (typeof window === 'undefined') return getDefaultLocations();
  
  try {
    const stored = localStorage.getItem(LOCATIONS_STORAGE_KEY);
    if (!stored) return getDefaultLocations();
    
    const locations = JSON.parse(stored);
    // Convert date strings back to Date objects
    return locations.map((location: Location & { createdAt: string }) => ({
      ...location,
      createdAt: new Date(location.createdAt)
    }));
  } catch (error) {
    console.error('Error loading locations from storage:', error);
    return getDefaultLocations();
  }
};

export const saveLocation = (location: Location): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const locations = getStoredLocations();
    const existingIndex = locations.findIndex(l => l.id === location.id);
    
    if (existingIndex >= 0) {
      locations[existingIndex] = location;
    } else {
      locations.push(location);
    }
    
    localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(locations));
  } catch (error) {
    console.error('Error saving location to storage:', error);
  }
};

export const deleteLocation = (locationId: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const locations = getStoredLocations();
    const filtered = locations.filter(location => location.id !== locationId);
    localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting location from storage:', error);
  }
};

// Default locations for new installations
const getDefaultLocations = (userId: string = 'default'): Location[] => [
  {
    id: '1',
    name: 'Garage',
    description: 'Main storage area for seasonal items and tools',
    user_id: userId,
    createdAt: new Date('2024-01-01')
  },
  {
    id: '2', 
    name: 'Storage Room',
    description: 'Climate-controlled room for electronics and appliances',
    user_id: userId,
    createdAt: new Date('2024-01-02')
  },
  {
    id: '3',
    name: 'Bedroom Closet',
    description: 'Upper shelf storage for clothing and linens',
    user_id: userId,
    createdAt: new Date('2024-01-03')
  },
  {
    id: '4',
    name: 'Basement',
    description: 'Long-term storage for books and archives',
    user_id: userId,
    createdAt: new Date('2024-01-04')
  },
  {
    id: '5',
    name: 'Attic',
    description: 'Overhead storage space - check temperature sensitivity',
    user_id: userId,
    createdAt: new Date('2024-01-05')
  }
];

// Utility to get box count for a location
export const getBoxCountForLocation = (locationId: string): number => {
  const boxes = getStoredBoxes();
  return boxes.filter(box => box.locationId === locationId).length;
}; 