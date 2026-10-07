import { Router, type Request, type Response } from "express";

const roomsRouter: Router = Router();

export interface RoomItem {
  id: string;
  code: string;
  title: string;
  gameType: "chkobba" | "rami";
  playerCount: number;
  maxPlayers: number;
  entryFee: number;
  targetScore: number;
  status: "waiting" | "in_progress" | "finished";
  hostName: string;
}

let mockRooms: RoomItem[] = [
  {
    id: "room-101",
    code: "TUN21",
    title: "قهوة العالية · Chkobba 2v2",
    gameType: "chkobba",
    playerCount: 3,
    maxPlayers: 4,
    entryFee: 100,
    targetScore: 21,
    status: "waiting",
    hostName: "CH AMINE",
  },
  {
    id: "room-102",
    code: "CHK77",
    title: "دفي 1 ضد 1 · السبع الحيّة",
    gameType: "chkobba",
    playerCount: 1,
    maxPlayers: 2,
    entryFee: 250,
    targetScore: 21,
    status: "waiting",
    hostName: "ANIS",
  },
  {
    id: "room-103",
    code: "RAM51",
    title: "طاولة الرامي الكلاسيكية",
    gameType: "rami",
    playerCount: 2,
    maxPlayers: 4,
    entryFee: 500,
    targetScore: 51,
    status: "waiting",
    hostName: "MAHDI V.",
  },
];

/**
 * GET /api/rooms
 * List open game rooms
 */
roomsRouter.get("/rooms", (req: Request, res: Response) => {
  const { gameType } = req.query;
  const filtered = gameType
    ? mockRooms.filter((r) => r.gameType === gameType)
    : mockRooms;
  res.json({
    success: true,
    data: filtered,
  });
});

/**
 * POST /api/rooms
 * Create a new room
 */
roomsRouter.post("/rooms", (req: Request, res: Response) => {
  const { title, gameType, maxPlayers, entryFee, targetScore } = req.body;
  const code = Math.random().toString(36).substring(2, 7).toUpperCase();

  const newRoom: RoomItem = {
    id: `room-${Date.now()}`,
    code,
    title: title || (gameType === "rami" ? "طاولة رامي جديدة" : "طاولة شكبة جديدة"),
    gameType: gameType || "chkobba",
    playerCount: 1,
    maxPlayers: maxPlayers || 2,
    entryFee: entryFee || 100,
    targetScore: targetScore || 21,
    status: "waiting",
    hostName: "monitoralk",
  };

  mockRooms.unshift(newRoom);

  res.status(201).json({
    success: true,
    message: "Table créée avec succès !",
    data: newRoom,
  });
});

/**
 * POST /api/rooms/join
 * Join a room by code
 */
roomsRouter.post("/rooms/join", (req: Request, res: Response) => {
  const { code } = req.body;
  const room = mockRooms.find((r) => r.code === code?.toUpperCase());

  if (!room) {
    res.status(404).json({ success: false, message: "Code de table introuvable" });
    return;
  }

  if (room.playerCount >= room.maxPlayers) {
    res.status(400).json({ success: false, message: "La table est déjà complète" });
    return;
  }

  room.playerCount += 1;
  res.json({
    success: true,
    message: "Vous avez rejoint la table !",
    data: room,
  });
});

export default roomsRouter;
