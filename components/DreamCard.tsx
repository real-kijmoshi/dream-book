import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { AntDesign } from "@expo/vector-icons";

interface Dream {
  id: number;
  date: string;
  name: string;
  description: string;
  mood: string;
  location: string;
  coordinates: string;
  notes: string;
  tags: string;
  created_at: string;
  weather?: string; // Made optional since it's not in the database schema
}

export default function DreamCard({ dream }: { dream: Dream }) {
  const tagList = dream.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
  
  // Helper function to determine mood icon and color
  const getMoodInfo = (mood: string) => {
    const lowercaseMood = mood.toLowerCase();
    
    if (lowercaseMood.includes('happy') || lowercaseMood.includes('joy') || lowercaseMood.includes('good')) {
      return { icon: 'smile-circle', color: '#73E2A7' };
    } else if (lowercaseMood.includes('sad') || lowercaseMood.includes('depress')) {
      return { icon: 'frowno', color: '#6C8EFE' };
    } else if (lowercaseMood.includes('scare') || lowercaseMood.includes('fear') || lowercaseMood.includes('nightmare')) {
      return { icon: 'exclamationcircleo', color: '#FF6B6B' };
    } else if (lowercaseMood.includes('calm') || lowercaseMood.includes('peace')) {
      return { icon: 'clouddownloado', color: '#ADB2FF' };
    } else if (lowercaseMood.includes('confus') || lowercaseMood.includes('weird')) {
      return { icon: 'questioncircleo', color: '#FFD166' };
    } else {
      return { icon: 'meho', color: '#B8B8D1' };
    }
  };
  
  const moodInfo = getMoodInfo(dream.mood);
  
  // Format date for better display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{dream.name}</Text>
        <View style={[styles.moodBadge, { backgroundColor: moodInfo.color + '30' }]}>
          <AntDesign size={14} color={moodInfo.color} name={moodInfo.icon as "smile-circle" | "frowno" | "exclamationcircleo" | "clouddownloado" | "questioncircleo"} />
          <Text style={[styles.moodText, { color: moodInfo.color }]}>{dream.mood}</Text>
        </View>
      </View>
      
      <Text style={styles.description}>{dream.description}</Text>
      
      <View style={styles.metaContainer}>
        <View style={styles.metaItem}>
          <AntDesign name="enviromento" size={14} color="#B8B8D1" />
          <Text style={styles.metaText}>{dream.location}</Text>
        </View>
        
        {dream.weather && (
          <View style={styles.metaItem}>
            <AntDesign name="cloudo" size={14} color="#B8B8D1" />
            <Text style={styles.metaText}>{dream.weather}</Text>
          </View>
        )}

        {dream.coordinates && (
          <View style={styles.metaItem}>
            <AntDesign name="enviroment" size={14} color="#B8B8D1" />
            <Text style={styles.metaText}>
                {JSON.parse(dream.coordinates).latitude.toFixed(2)}, {JSON.parse(dream.coordinates).longitude.toFixed(2)}
            </Text>
          </View>
        )}
      </View>
      
      {dream.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesTitle}>Notes</Text>
          <Text style={styles.notes}>{dream.notes}</Text>
        </View>
      )}
      
      {tagList.length > 0 && (
        <View style={styles.tagsContainer}>
          {tagList.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}
      
      <Text style={styles.date}>{formatDate(dream.date)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: "rgba(26, 26, 46, 0.8)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#3a86ff",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    flex: 1,
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  moodText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  description: {
    fontSize: 15,
    color: "#e1e1ff",
    marginBottom: 16,
    lineHeight: 22,
  },
  metaContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 13,
    color: "#B8B8D1",
    marginLeft: 6,
  },
  notesContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#B8B8D1",
    marginBottom: 6,
  },
  notes: {
    fontSize: 14,
    color: "#D1D1E9",
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: "rgba(58, 134, 255, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: "#87A3FF",
    fontWeight: "500",
  },
  date: {
    fontSize: 12,
    color: "#8888AA",
    textAlign: 'right',
  }
});