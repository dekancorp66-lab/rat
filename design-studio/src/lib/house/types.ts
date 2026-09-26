export type RoofStyle = "hip" | "gable" | "shed" | "flat";
export type ViewTab = "model" | "plans" | "elevations" | "roof" | "layout" | "quantities";
export type WallSide = "n" | "s" | "e" | "w";
export type RoomKind =
  | "verandah"
  | "living"
  | "kitchen"
  | "dining"
  | "passage"
  | "bedroom"
  | "master"
  | "bathroom"
  | "stair"
  | "balcony"
  | "store"
  | "hall"
  | "study";

export interface HouseSpec {
  name: string;
  templateId: string;
  plotWidth: number;
  plotLength: number;
  bedrooms: number;
  bathrooms: number;
  includeVerandah: boolean;
  includePassage: boolean;
  livingRoomWidthPct: number;
  kitchenWidthPct: number;
  bedroomSize: number;
  roofStyle: RoofStyle;
  floorHeight: number;
  wallThickness: number;
  stories: 1 | 2;
  style: string;
}

export type Room = {
  id: string;
  name: string;
  kind: RoomKind;
  floor: 0 | 1;
  x: number;
  y: number;
  w: number;
  l: number;
  openSides?: WallSide[];
};

export type Opening = {
  id: string;
  type: "door" | "window";
  roomId: string;
  wall: WallSide;
  offset: number;
  width: number;
  height: number;
  sill: number;
  connectsTo?: string;
  /** Id of the wall this opening sits in; `offset` is measured from that wall's start. */
  wallId?: string;
  /** Absolute plan-space end points of the opening (ft). */
  p1: [number, number];
  p2: [number, number];
};

export type WallSeg = {
  id: string;
  floor: 0 | 1;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  interior: boolean;
  roomId: string;
  side: WallSide;
  openings: Opening[];
};

export type HouseModel = {
  spec: HouseSpec;
  rooms: Room[];
  openings: Opening[];
  walls: WallSeg[];
  envelope: { x: number; y: number; w: number; l: number };
  plot: { w: number; l: number };
  stories: 1 | 2;
  wallT: number;
  floorH: number;
  plinthH: number;
  slabT: number;
};

export type TemplateMeta = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  cover: string;
  bedrooms: number;
  bathrooms: number;
  style: string;
  roof: RoofStyle;
  roofLabel: string;
  plotHint: string;
  minWidth: number;
  minLength: number;
  stories: 1 | 2;
  spec: Partial<HouseSpec>;
};
