import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as SQLite from "expo-sqlite";
import * as Location from 'expo-location';


export default function DreamEntryModal() {
  const { date } = useLocalSearchParams();
  const serializedDate = new Date(date as string);
  const formattedDate = serializedDate.toISOString().split("T")[0];

  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [mood, setMood] = useState<string>("");
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [location, setLocation] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [tags, setTags] = useState<string>("");

  const router = useRouter();

  const moodOptions = [
    { label: "Joyful", icon: "sentiment-very-satisfied" },
    { label: "Calm", icon: "spa" },
    { label: "Scared", icon: "sentiment-very-dissatisfied" },
    { label: "Confused", icon: "help" },
    { label: "Anxious", icon: "warning" },
  ];

  const handleSubmit = async () => {
    try {
      const dreamData = {
        date: formattedDate,
        name,
        description,
        mood,
        coordinates: coordinates ? JSON.stringify(coordinates) : `coordinates not available`,
        location,
        notes,
        tags,
        created_at: new Date().toISOString(),
      };
  
      console.log("Dream Data:", dreamData);
      
      // Open the database
      const db = await SQLite.openDatabaseAsync("database.db");

      
      // First, make sure the table exists
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS dreams (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT,
          name TEXT,
          description TEXT,
          mood TEXT,
          coordinates TEXT,
          location TEXT,
          notes TEXT,
          tags TEXT,
          created_at TEXT
        )
      `);
  
      // Now insert the data
      const result = await db.runAsync(
        `INSERT INTO dreams (date, name, description, mood, location, coordinates, notes, tags, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dreamData.date,
          dreamData.name,
          dreamData.description,
          dreamData.mood,
          dreamData.location,
          dreamData.coordinates,
          dreamData.notes,
          dreamData.tags,
          dreamData.created_at
        ]
      );
  
      console.log("Row inserted with result:", result);

      router.back();
      
    } catch (error) {
      console.error("Database error:", error);
    }
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.error("Permission to access location was denied");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      console.log("Location:", location);

      const { latitude, longitude } = location.coords;
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      const address = reverseGeocode[0];
      const formattedAddress = `${address.name}, ${address.city}, ${address.region}, ${address.country}`;
      setLocation(formattedAddress);
      setCoordinates({ latitude, longitude });
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  // Call getLocation when the component mounts
  useEffect(() => {
    getLocation();
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={["#1a2151", "#2d3a80", "#4c5fbc"]}
        style={styles.container}
      >
        <Image
          source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/LH_95.jpg/500px-LH_95.jpg" }}
          style={styles.backgroundImage}
        />
        <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />

        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Dream Entry</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.dateContainer}>
            <MaterialIcons name="event" size={20} color="#a2b5fb" />
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Dream Title</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="title" size={20} color="#a2b5fb" />
                <TextInput
                  style={styles.textInput}
                  placeholder="Give your dream a name"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <View style={[styles.inputWrapper, styles.multilineWrapper]}>
                <MaterialIcons
                  name="description"
                  size={20}
                  color="#a2b5fb"
                  style={{ marginTop: 10 }}
                />
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  placeholder="What happened in your dream?"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>How did you feel?</Text>
              <View style={styles.moodContainer}>
                {moodOptions.map((option) => (
                  <TouchableOpacity
                    key={option.label}
                    style={[
                      styles.moodOption,
                      mood === option.label && styles.selectedMood,
                    ]}
                    onPress={() => setMood(option.label)}
                  >
                    <MaterialIcons
                      name={option.icon as keyof typeof MaterialIcons.glyphMap}
                      size={24}
                      color={mood === option.label ? "#fff" : "#a2b5fb"}
                    />
                    <Text
                      style={[
                        styles.moodText,
                        mood === option.label && styles.selectedMoodText,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="place" size={20} color="#a2b5fb" />
                <TextInput
                  style={styles.textInput}
                  placeholder="Where did this dream take place?"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Additional Notes</Text>
              <View style={[styles.inputWrapper, styles.multilineWrapper]}>
                <MaterialIcons
                  name="note"
                  size={20}
                  color="#a2b5fb"
                  style={{ marginTop: 10 }}
                />
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  placeholder="Any additional thoughts or context about this dream"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tags</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="local-offer" size={20} color="#a2b5fb" />
                <TextInput
                  style={styles.textInput}
                  placeholder="Separate tags with commas (flying, water, family)"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={tags}
                  onChangeText={setTags}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
            <MaterialIcons name="save" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>Save Dream</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingBottom: 10,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 8,
  },
  dateText: {
    color: "#a2b5fb",
    fontSize: 16,
    marginLeft: 8,
    fontWeight: "500",
  },
  formContainer: {
    backgroundColor: "rgba(26, 33, 81, 0.75)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(162, 181, 251, 0.2)",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(162, 181, 251, 0.3)",
  },
  multilineWrapper: {
    alignItems: "flex-start",
    paddingVertical: 10,
  },
  textInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  multilineInput: {
    minHeight: 120,
  },
  moodContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 5,
  },
  moodOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(162, 181, 251, 0.3)",
    width: "48%",
  },
  selectedMood: {
    backgroundColor: "rgba(122, 141, 211, 0.9)",
    borderColor: "#fff",
  },
  moodText: {
    color: "#a2b5fb",
    marginLeft: 8,
    fontSize: 14,
  },
  selectedMoodText: {
    color: "#fff",
    fontWeight: "600",
  },
  saveButton: {
    flexDirection: "row",
    backgroundColor: "#6c63ff",
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    alignSelf: "center",
    width: "80%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 10,
  },
});