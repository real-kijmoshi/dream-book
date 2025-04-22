import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated, Modal, Pressable } from "react-native";
import * as SQLite from "expo-sqlite";
import { useEffect, useState, useRef, useCallback } from "react";
import { GestureHandlerRootView, PanGestureHandler } from "react-native-gesture-handler";
import { AntDesign } from "@expo/vector-icons";
import { useDay } from "@/hooks/useDay";
import { useFocusEffect, useRouter } from "expo-router";
import DreamCard from "@/components/DreamCard";

const getWeekDays = (date: Date) => {
  const days = [];
  const firstDayOfWeek = 1; // Monday
  
  // Calculate current day of week
  const currentDay = date.getDay();
  
  // Calculate first day of week
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - currentDay + firstDayOfWeek);
  
  // Generate all 7 days
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    days.push(day);
  }
  return days;
};

const generateCalendarDays = (year: number, month: number) => {
  const days = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Add previous month's days to fill first row
  const firstDayOfWeek = firstDay.getDay();
  for (let i = firstDayOfWeek; i > 0; i--) {
    const day = new Date(year, month, 1 - i);
    days.push({ date: day, currentMonth: false });
  }
  
  // Add current month's days
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({ date: new Date(year, month, i), currentMonth: true });
  }
  
  // Add next month's days to fill last row
  const remainingDays = 42 - days.length; // 6 rows of 7 days
  for (let i = 1; i <= remainingDays; i++) {
    days.push({ date: new Date(year, month + 1, i), currentMonth: false });
  }
  
  return days;
};

export default function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(getWeekDays(currentViewDate));
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const day = useDay(selectedDate);

  const router = useRouter();

  const translateX = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    initDb();
  }, []);
  
  useEffect(() => {
    setCurrentWeek(getWeekDays(currentViewDate));
  }, [currentViewDate]);


  const initDb = async () => {
    const db = await SQLite.openDatabaseAsync("database.db");
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS dreams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        mood TEXT NOT NULL,
        location TEXT NOT NULL,
        coordinates TEXT NOT NULL,
        notes TEXT NOT NULL,
        tags TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
  };

  const refreshData = useCallback(() => {
    setSelectedDate(date => new Date(date.getTime()));
  }, []);
  
  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData])
  );

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const animateWeekChange = (direction: number) => {
    Animated.timing(opacityAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true
    }).start(() => {
      const newDate = new Date(currentViewDate);
      newDate.setDate(currentViewDate.getDate() + (direction * 7));
      setCurrentViewDate(newDate);
      
      translateX.setValue(0);
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true
      }).start();
    });
  };

  const onGestureEvent = (event: any) => {
    translateX.setValue(event.nativeEvent.translationX / 2);
  };

  const onGestureEnd = (event: any) => {
    const { translationX, velocityX } = event.nativeEvent;
    
    if (translationX > 50 || velocityX > 500) {
      animateWeekChange(-1);
    } else if (translationX < -50 || velocityX < -500) {
      animateWeekChange(1);
    } else {
      Animated.spring(translateX, {
        toValue: 0,
        friction: 5,
        tension: 40,
        useNativeDriver: true
      }).start();
    }
  };
  
  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentViewDate(today);
    setCalendarMonth(today.getMonth());
    setCalendarYear(today.getFullYear());
    
    translateX.setValue(-5);
    Animated.spring(translateX, {
      toValue: 0,
      friction: 5,
      tension: 40,
      useNativeDriver: true
    }).start();
  };
  
  const changeMonth = (increment: number) => {
    let newMonth = calendarMonth + increment;
    let newYear = calendarYear;
    
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    
    setCalendarMonth(newMonth);
    setCalendarYear(newYear);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dream Journal</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
            <AntDesign name="calendar" size={16} color="#fff" />
            <Text style={styles.todayButtonText}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCalendarVisible(true)}>
            <AntDesign name="appstore1" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      
      <PanGestureHandler 
        onGestureEvent={onGestureEvent}
        onEnded={onGestureEnd}
      >
        <Animated.View style={[
          styles.weekContainer,
          { 
            transform: [{ translateX }],
            opacity: opacityAnim
          }
        ]}>
          <FlatList
            data={currentWeek}
            keyExtractor={(item) => item.toISOString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.dayContainer}
                onPress={() => setSelectedDate(item)}
              >
                <View style={[
                  styles.circle,
                  isToday(item) && styles.todayCircle,
                  isSelected(item) && styles.selectedCircle,
                ]}>
                  <Text style={[
                    styles.monthday,
                    isSelected(item) && styles.selectedText
                  ]}>
                    {item.getDate()}
                  </Text>
                </View>
                <Text style={styles.weekday}>
                  {item.toLocaleString("default", { weekday: "short" })}
                </Text>
              </TouchableOpacity>
            )}
            horizontal={false}
            numColumns={7}
            contentContainerStyle={styles.daysGrid}
          />
        </Animated.View>
      </PanGestureHandler>

      
      <View style={styles.dreamCard}>
        {
          day.length > 0 ? (
            <FlatList
              data={day}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <DreamCard dream={item} />
              )}
              style={{ width: "100%" }}
            />
          ) : (
            <Text style={styles.dreamText}>
              No dreams recorded for this date.
            </Text>
          )
        }
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push(`/modal?date=${selectedDate.toISOString()}`)}
          >
          <Text 
            style={styles.addButtonText}>
            Add Dream
          </Text>
        </TouchableOpacity>


        <Text style={styles.dateText}>
          {selectedDate.toDateString()}
        </Text>
      </View>

      <Modal
        visible={calendarVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCalendarVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setCalendarVisible(false)}
        >
          <View style={styles.calendarModal}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => changeMonth(-1)}>
                <AntDesign name="left" size={22} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.calendarTitle}>
                {new Date(calendarYear, calendarMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => changeMonth(1)}>
                <AntDesign name="right" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.weekdayHeader}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Text key={day} style={styles.weekdayHeaderText}>{day}</Text>
              ))}
            </View>
            
            <FlatList
              data={generateCalendarDays(calendarYear, calendarMonth)}
              keyExtractor={(item) => item.date.toISOString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.calendarDay}
                  onPress={() => {
                    setSelectedDate(item.date);
                    setCurrentViewDate(item.date);
                    setCalendarVisible(false);
                  }}
                >
                  <View style={[
                    styles.calendarDayCircle,
                    !item.currentMonth && styles.otherMonthDay,
                    isToday(item.date) && styles.todayCircle,
                    isSelected(item.date) && styles.selectedCircle,
                  ]}>
                    <Text style={[
                      styles.calendarDayText,
                      !item.currentMonth && styles.otherMonthText,
                      isSelected(item.date) && styles.selectedText
                    ]}>
                      {item.date.getDate()}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              numColumns={7}
            />
          </View>
        </Pressable>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D1A",
    paddingTop: 60,
    paddingBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "rgba(58, 134, 255, 0.7)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 15,
  },
  todayButtonText: {
    marginLeft: 5,
    color: "#fff",
    fontWeight: "600",
  },
  weekContainer: {
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    marginHorizontal: 15,
  },
  daysGrid: {
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayContainer: {
    alignItems: "center",
    width: "14.28%",
    padding: 5,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  todayCircle: {
    borderWidth: 1,
    borderColor: "#e1e1ff",
  },
  selectedCircle: {
    backgroundColor: "#3a86ff",
  },
  monthday: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  selectedText: {
    color: "#fff",
    fontWeight: "700",
  },
  weekday: {
    marginTop: 5,
    fontSize: 10,
    color: "#bbb",
  },
  dreamCard: {
    flex: 1,
    margin: 20,
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  dateText: {
    fontSize: 8,
    color: "#fff",
  },
  addButton: {
    backgroundColor: "#3a86ff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 20,
    marginBottom: 10,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  dreamText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  calendarModal: {
    width: "85%",
    backgroundColor: "#1A1A2E",
    borderRadius: 15,
    padding: 15,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  calendarTitle: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
  },
  weekdayHeader: {
    flexDirection: "row",
    marginBottom: 10,
  },
  weekdayHeaderText: {
    width: "14.28%",
    textAlign: "center",
    color: "#bbb",
    fontSize: 12,
  },
  calendarDay: {
    width: "14.28%",
    alignItems: "center",
    padding: 5,
  },
  calendarDayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarDayText: {
    fontSize: 14,
    color: "#fff",
  },
  otherMonthDay: {
    backgroundColor: "transparent",
  },
  otherMonthText: {
    color: "rgba(255, 255, 255, 0.3)",
  }
});