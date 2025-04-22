import { useEffect, useState } from "react";
import * as SQLite from "expo-sqlite";

interface Dream {
    id: number;
    date: string;
    name: string;
    description: string;
    mood: string;
    location: string;
    coordinates: string;
    weather: string;
    notes: string;
    tags: string;
    created_at: string;
}

export const useDay = (currentDate: Date) => {
    const [dreams, setDreams] = useState<Dream[]>([]);
    const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);

    useEffect(() => {
        (async () => {
            const db = await SQLite.openDatabaseAsync("database.db");

            if (db) {
                setDb(db);
            } else {
                console.error("Failed to open database");
            }
        })();
    }, []);

    
    useEffect(() => {
        (async () => {
            if(!db || !currentDate) return;

            const formattedDate = currentDate.toISOString().split("T")[0];
            const query = `SELECT * FROM dreams WHERE date = ?`
            const params = [formattedDate];

            console.log("Fetching dreams for date:", formattedDate);

            const currentDreams = await db.getAllAsync(query, params);
            if (currentDreams) {
                console.log("Dreams fetched:", currentDreams);
                setDreams(currentDreams as Dream[]);
            } else {
                console.error("Failed to fetch dreams");
            }

        })();
    }, [currentDate, db]);
    
    return dreams;
}