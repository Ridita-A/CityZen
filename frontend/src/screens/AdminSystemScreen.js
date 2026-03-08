import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList, Alert, ActivityIndicator, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Tags, Building2, UserX, ArrowLeft, Plus, UserCheck, Edit2, MapPin, Trash2, X } from 'lucide-react-native';
import api from '../services/api';

export default function AdminSystemScreen({ darkMode }) {
  const [view, setView] = useState('main'); 
  const [categories, setCategories] = useState([]);
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newCategoryDept, setNewCategoryDept] = useState([]);
  const [editDeptModalVisible, setEditDeptModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingCategoryDept, setEditingCategoryDept] = useState([]);
  
  // Department form state
  const [deptModalVisible, setDeptModalVisible] = useState(false);
  const [editingDept, setEditingDept] = useState(null); // null for new, object for edit
  const [deptForm, setDeptForm] = useState({ name: '', description: '', areas: [] });
  const [newArea, setNewArea] = useState({ name: '', latitude: '', longitude: '', radius: '' });
  const [editingAreaIndex, setEditingAreaIndex] = useState(null); // index of area being edited
  
  // Dynamic Offenders and Banned Users
  const [offenders, setOffenders] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  // Fetch offenders and banned users
  const fetchOffenders = async () => {
    try {
      // Use correct API path
      const res = await api.get('/moderation/offenders');
      setOffenders(res.data || []);
    } catch (error) {
      setOffenders([]);
    }
  };

  const fetchBannedUsers = async () => {
    try {
      const res = await api.get('/moderation/banned-users');
      // Some endpoints return { bannedUsers: [...] }
      setBannedUsers(res.data?.bannedUsers || res.data || []);
    } catch (error) {
      setBannedUsers([]);
    }
  };


  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      await Promise.all([
        fetchCategories(),
        fetchDepartments(),
        fetchOffenders(),
        fetchBannedUsers()
      ]);
      setLoading(false);
    };
    bootstrap();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/complaints/categories');
      setCategories(response.data || []);
    } catch (error) {
      Alert.alert('Error', 'Could not load categories.');
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepts(response.data || []);
    } catch (error) {
      Alert.alert('Error', 'Could not load departments.');
    }
  };

  const handleAddCategory = async () => {
    const value = newCategory.trim();
    if (!value) {
      Alert.alert('Missing info', 'Please enter a category name.');
      return;
    }
    if (!newCategoryDept.length) {
      Alert.alert('Missing info', 'Please select at least one department for the new category.');
      return;
    }
    try {
      setIsSubmitting(true);
      await api.post('/complaints/categories', { name: value, departmentId: newCategoryDept });
      setNewCategory('');
      setNewCategoryDept([]);
      await fetchCategories();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Unable to save.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDeptModal = (category) => {
    setEditingCategory(category);
    setEditingCategoryDept(Array.isArray(category.AuthorityCompanies) ? category.AuthorityCompanies.map(ac => ac.id) : []);
    setEditDeptModalVisible(true);
  };

  const closeEditDeptModal = () => {
    setEditDeptModalVisible(false);
    setEditingCategory(null);
    setEditingCategoryDept(null);
  };

  const handleUpdateCategoryDept = async () => {
    if (!editingCategory || !editingCategoryDept.length) return;
    try {
      setIsSubmitting(true);
      await api.put(`/complaints/categories/${editingCategory.id}/departments`, { departmentId: editingCategoryDept });
      await fetchCategories();
      closeEditDeptModal();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Unable to update department.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeptModal = (dept = null) => {
    if (dept) {
      setEditingDept(dept);
      setDeptForm({
        name: dept.name,
        description: dept.description || '',
        areas: dept.AuthorityCompanyAreas || []
      });
    } else {
      setEditingDept(null);
      setDeptForm({ name: '', description: '', areas: [] });
    }
    setNewArea({ name: '', latitude: '', longitude: '', radius: '' });
    setDeptModalVisible(true);
  };

  const closeDeptModal = () => {
    setDeptModalVisible(false);
    setEditingDept(null);
    setDeptForm({ name: '', description: '', areas: [] });
    setNewArea({ name: '', latitude: '', longitude: '', radius: '' });
    setEditingAreaIndex(null);
  };

  const addAreaToForm = () => {
    if (!newArea.name.trim() || !newArea.latitude || !newArea.longitude || !newArea.radius) {
      Alert.alert('Missing info', 'All area fields are required (name, latitude, longitude, radius).');
      return;
    }
    const lat = parseFloat(newArea.latitude);
    const lng = parseFloat(newArea.longitude);
    const rad = parseFloat(newArea.radius);
    if (isNaN(lat) || isNaN(lng) || isNaN(rad)) {
      Alert.alert('Invalid values', 'Latitude, longitude, and radius must be valid numbers.');
      return;
    }
    
    if (editingAreaIndex !== null) {
      // Update existing area
      setDeptForm(prev => ({
        ...prev,
        areas: prev.areas.map((a, i) => 
          i === editingAreaIndex 
            ? { ...a, name: newArea.name.trim(), latitude: lat, longitude: lng, radius: rad }
            : a
        )
      }));
      setEditingAreaIndex(null);
    } else {
      // Add new area
      setDeptForm(prev => ({
        ...prev,
        areas: [...prev.areas, { name: newArea.name.trim(), latitude: lat, longitude: lng, radius: rad }]
      }));
    }
    setNewArea({ name: '', latitude: '', longitude: '', radius: '' });
  };

  const editArea = (index) => {
    const area = deptForm.areas[index];
    setNewArea({
      name: area.name,
      latitude: String(area.latitude),
      longitude: String(area.longitude),
      radius: String(area.radius)
    });
    setEditingAreaIndex(index);
  };

  const cancelEditArea = () => {
    setNewArea({ name: '', latitude: '', longitude: '', radius: '' });
    setEditingAreaIndex(null);
  };

  const removeAreaFromForm = (index) => {
    setDeptForm(prev => ({
      ...prev,
      areas: prev.areas.filter((_, i) => i !== index)
    }));
  };

  const saveDepartment = async () => {
    if (!deptForm.name.trim()) {
      Alert.alert('Missing info', 'Department name is required.');
      return;
    }
    try {
      setIsSubmitting(true);
      const payload = {
        name: deptForm.name.trim(),
        description: deptForm.description.trim(),
        areas: deptForm.areas
      };
      if (editingDept) {
        await api.put(`/departments/${editingDept.id}`, payload);
      } else {
        await api.post('/departments', payload);
      }
      await fetchDepartments();
      closeDeptModal();
      Alert.alert('Success', editingDept ? 'Department updated.' : 'Department created.');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Unable to save department.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLiftBan = async (id) => {
    Alert.alert("Lift Ban", `Unban ${id}?`, [
      { text: "Cancel" },
      { text: "Lift Ban", onPress: async () => {
        try {
          await api.post(`/admin/unban-user`, { id });
          await fetchBannedUsers();
        } catch (error) {
          Alert.alert('Error', 'Failed to lift ban.');
        }
      } }
    ]);
  };

  const handleLiftStrikes = async (id) => {
    Alert.alert("Reset Strikes", `Reset all strikes for ${id}?`, [
      { text: "Cancel" },
      { text: "Reset", onPress: async () => {
        try {
          await api.post(`/admin/reset-strikes`, { id });
          await fetchOffenders();
        } catch (error) {
          Alert.alert('Error', 'Failed to reset strikes.');
        }
      } }
    ]);
  };

  // Department Modal Component
  const DepartmentModal = () => (
    <Modal visible={deptModalVisible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={[styles.modalContent, darkMode && styles.cardDark]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, darkMode && {color: 'white'}]}>
              {editingDept ? 'Edit Department' : 'New Department'}
            </Text>
            <TouchableOpacity onPress={closeDeptModal}><X color={darkMode ? 'white' : 'black'} size={24} /></TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Basic Info */}
            <Text style={[styles.fieldLabel, darkMode && {color: '#9CA3AF'}]}>Name *</Text>
            <TextInput
              style={[styles.input, darkMode && styles.inputDark]}
              placeholder="e.g. DPHE"
              placeholderTextColor="#9CA3AF"
              value={deptForm.name}
              onChangeText={(t) => setDeptForm(p => ({...p, name: t}))}
            />

            <Text style={[styles.fieldLabel, darkMode && {color: '#9CA3AF'}]}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea, darkMode && styles.inputDark]}
              placeholder="What does this department handle?"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              value={deptForm.description}
              onChangeText={(t) => setDeptForm(p => ({...p, description: t}))}
            />

            {/* Handles section: always rendered */}
            <View style={{ marginTop: 18 }}>
              <Text style={[styles.fieldLabel, darkMode && {color: '#9CA3AF'}]}>Handles</Text>
              {editingDept && editingDept.Categories && editingDept.Categories.length > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
                  {editingDept.Categories.map(cat => (
                    <View key={cat.id} style={{ backgroundColor: '#F3F4F6', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 6, marginRight: 6 }}>
                      <Text style={{ color: darkMode ? 'white' : '#1E293B', fontSize: 13 }}>{cat.name}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={{ color: '#9CA3AF', fontSize: 13, marginTop: 4 }}>No issues assigned</Text>
              )}
            </View>

            {/* Service Areas */}
            <View style={styles.sectionHeader}>
              <MapPin color="#F59E0B" size={18} />
              <Text style={[styles.sectionTitle, darkMode && {color: 'white'}]}>Service Areas</Text>
            </View>
            <Text style={styles.helpText}>Define areas where this department operates. Complaints outside these areas won't be assigned to this department.</Text>

            {deptForm.areas.map((area, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={[styles.areaCard, darkMode && {backgroundColor: '#374151'}, editingAreaIndex === idx && styles.areaCardEditing]}
                onPress={() => editArea(idx)}
              >
                <View style={{flex: 1}}>
                  <Text style={[styles.areaName, darkMode && {color: 'white'}]}>{area.name}</Text>
                  <Text style={styles.areaCoords}>
                    {area.latitude}, {area.longitude} • {area.radius} km radius
                  </Text>
                  <Text style={styles.tapToEdit}>Tap to edit</Text>
                </View>
                <TouchableOpacity onPress={() => removeAreaFromForm(idx)} style={styles.removeBtn}>
                  <Trash2 color="#EF4444" size={18} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}

            {/* Add/Edit Area Form */}
            <View style={[styles.addAreaCard, darkMode && {backgroundColor: '#374151'}]}>
              <View style={styles.areaFormHeader}>
                <Text style={[styles.addAreaTitle, darkMode && {color: 'white'}]}>
                  {editingAreaIndex !== null ? 'Edit Area' : 'Add Area'}
                </Text>
                {editingAreaIndex !== null && (
                  <TouchableOpacity onPress={cancelEditArea}>
                    <Text style={styles.cancelEditText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={[styles.input, styles.inputSmall, darkMode && styles.inputDark]}
                placeholder="Area name (e.g. Downtown)"
                placeholderTextColor="#9CA3AF"
                value={newArea.name}
                onChangeText={(t) => setNewArea(p => ({...p, name: t}))}
              />
              <View style={styles.coordRow}>
                <TextInput
                  style={[styles.input, styles.inputSmall, {flex: 1, marginRight: 8}, darkMode && styles.inputDark]}
                  placeholder="Latitude"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={newArea.latitude}
                  onChangeText={(t) => setNewArea(p => ({...p, latitude: t}))}
                />
                <TextInput
                  style={[styles.input, styles.inputSmall, {flex: 1}, darkMode && styles.inputDark]}
                  placeholder="Longitude"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={newArea.longitude}
                  onChangeText={(t) => setNewArea(p => ({...p, longitude: t}))}
                />
              </View>
              <TextInput
                style={[styles.input, styles.inputSmall, darkMode && styles.inputDark]}
                placeholder="Radius in km (e.g. 5)"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={newArea.radius}
                onChangeText={(t) => setNewArea(p => ({...p, radius: t}))}
              />
              <TouchableOpacity style={[styles.addAreaBtn, editingAreaIndex !== null && styles.updateAreaBtn]} onPress={addAreaToForm}>
                {editingAreaIndex !== null ? (
                  <Text style={styles.addAreaBtnText}>Update Area</Text>
                ) : (
                  <><Plus color="white" size={16} /><Text style={styles.addAreaBtnText}>Add Area</Text></>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={closeDeptModal}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, isSubmitting && {opacity: 0.6}]} onPress={saveDepartment} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Save Department</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  if (view === 'main') return (
    <ScrollView style={styles.container}>
      <Text style={[styles.title, darkMode && {color: 'white'}]}>System Config</Text>
      <MenuBtn icon={Tags} label="Categories" count={categories.length} color="#8B5CF6" darkMode={darkMode} onPress={() => setView('cat')} />
      <MenuBtn icon={Building2} label="Departments" count={depts.length} color="#F59E0B" darkMode={darkMode} onPress={() => setView('dept')} />
      <MenuBtn icon={UserX} label="Security & Bans" count={bannedUsers.length} color="#EF4444" darkMode={darkMode} onPress={() => setView('bans')} />
    </ScrollView>
  );

  const SubHeader = ({ title, onAdd }) => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => setView('main')}><ArrowLeft color={darkMode ? "white" : "black"} /></TouchableOpacity>
      <Text style={[styles.subTitle, darkMode && {color: 'white'}]}>{title.toUpperCase()}</Text>
      {onAdd ? (
        <TouchableOpacity onPress={onAdd}><Plus color="#1E88E5" /></TouchableOpacity>
      ) : (
        <View style={{width: 24}} />
      )}
    </View>
  );

  if (view === 'cat') return (
    <View style={styles.container}>
      <SubHeader title="Categories" />
      {loading ? (
        <ActivityIndicator color="#1E88E5" />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => String(item?.id || item?.name)}
          renderItem={({ item }) => (
            <View style={[styles.listItem, darkMode && styles.cardDark]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemText, darkMode && {color: 'white'}]}>{item?.name || item}</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 12 }}>
                  Dept: {item.AuthorityCompanies && item.AuthorityCompanies.length > 0 ? item.AuthorityCompanies.map(ac => ac.name).join(', ') : 'None assigned'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => openEditDeptModal(item)} style={{ marginLeft: 10 }}>
                <Edit2 color="#1E88E5" size={18} />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={[styles.emptyText, darkMode && {color: 'white'}]}>No items yet.</Text>}
          ListFooterComponent={
            <View style={[styles.addCard, darkMode && styles.cardDark]}>
              <Text style={[styles.addLabel, darkMode && {color: 'white'}]}>Add Category</Text>
              <View style={styles.addRow}>
                <TextInput
                  style={[styles.input, darkMode && styles.inputDark]}
                  placeholder="e.g. Drainage"
                  placeholderTextColor="#9CA3AF"
                  value={newCategory}
                  onChangeText={setNewCategory}
                />
              </View>
              <View style={{ marginTop: 10 }}>
                <Text style={[styles.fieldLabel, darkMode && {color: '#9CA3AF'}]}>Assign Departments *</Text>
                <View style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, backgroundColor: darkMode ? '#111827' : '#F3F4F6' }}>
                  {depts.map((dept) => {
                    const selected = Array.isArray(newCategoryDept) && newCategoryDept.includes(dept.id);
                    return (
                      <TouchableOpacity
                        key={dept.id}
                        style={{ padding: 10, backgroundColor: selected ? '#1E88E5' : 'transparent' }}
                        onPress={() => {
                          setNewCategoryDept(prev => {
                            if (!Array.isArray(prev)) return [dept.id];
                            return selected ? prev.filter(id => id !== dept.id) : [...prev, dept.id];
                          });
                        }}
                      >
                        <Text style={{ color: selected ? 'white' : (darkMode ? 'white' : 'black') }}>{dept.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              <TouchableOpacity style={[styles.addBtn, { marginTop: 10 }]} onPress={handleAddCategory} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="white" /> : <Plus color="white" size={16} />}
              </TouchableOpacity>
            </View>
          }
        />
      )}
      {/* Edit Department Modal for Category */}
      <Modal visible={editDeptModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, darkMode && styles.cardDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, darkMode && {color: 'white'}]}>Assign Department</Text>
              <TouchableOpacity onPress={closeEditDeptModal}><X color={darkMode ? 'white' : 'black'} size={24} /></TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              {depts.map((dept) => {
                const selected = Array.isArray(editingCategoryDept) && editingCategoryDept.includes(dept.id);
                return (
                  <TouchableOpacity
                    key={dept.id}
                    style={{ padding: 10, backgroundColor: selected ? '#1E88E5' : 'transparent', borderRadius: 8, marginBottom: 6 }}
                    onPress={() => {
                      setEditingCategoryDept(prev => {
                        if (!Array.isArray(prev)) return [dept.id];
                        return selected ? prev.filter(id => id !== dept.id) : [...prev, dept.id];
                      });
                    }}
                  >
                    <Text style={{ color: selected ? 'white' : (darkMode ? 'white' : 'black') }}>{dept.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeEditDeptModal}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, isSubmitting && {opacity: 0.6}]} onPress={handleUpdateCategoryDept} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  if (view === 'dept') return (
    <View style={styles.container}>
      <SubHeader title="Departments" onAdd={() => openDeptModal()} />
      <DepartmentModal />
      {loading ? (
        <ActivityIndicator color="#1E88E5" />
      ) : (
        <FlatList 
          data={depts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const areaCount = item.AuthorityCompanyAreas?.length || 0;
            const issueCount = item.Categories?.length || 0;
            return (
              <TouchableOpacity style={[styles.deptCard, darkMode && styles.cardDark]} onPress={() => openDeptModal(item)}>
                <View style={{flex: 1}}>
                  <Text style={[styles.itemText, darkMode && {color: 'white'}]}>{item.name}</Text>
                  {item.description ? (
                    <Text style={styles.deptDesc} numberOfLines={1}>{item.description}</Text>
                  ) : null}
                  <View style={styles.areaTag}>
                    <MapPin size={12} color="#F59E0B" />
                    <Text style={styles.areaTagText}>
                      {areaCount} area{areaCount !== 1 ? 's' : ''} • {issueCount} categor{issueCount === 1 ? 'y' : 'ies'}
                    </Text>
                  </View>
                </View>
                <Edit2 color="#9CA3AF" size={18} />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={<Text style={[styles.emptyText, darkMode && {color: 'white'}]}>No departments yet.</Text>}
        />
      )}
    </View>
  );

  if (view === 'bans') return (
    <ScrollView style={styles.container}>
      <SubHeader title="User Strikes & Bans" />
      <Text style={styles.sectionLabel}>Users with Strikes</Text>
      {offenders.length === 0 && (
        <Text style={[styles.emptyText, darkMode && {color: 'white'}]}>No users with strikes.</Text>
      )}
      {offenders.map(user => {
        const strikesLeft = 5 - user.strikes;
        return (
          <View key={user.uid} style={[styles.offenderCard, darkMode && styles.cardDark]}>
            <View style={styles.offRow}>
              <View>
                <Text style={[styles.offId, darkMode && {color: 'white'}]}>{user.email || user.uid}</Text>
                <Text style={styles.offSub}>Strikes: {user.strikes} / 5</Text>
                <Text style={styles.offSub}>
                  {strikesLeft > 0
                    ? `${strikesLeft} strike${strikesLeft === 1 ? '' : 's'} left before ban`
                    : 'Should be banned'}
                </Text>
              </View>
              <View style={{alignItems: 'flex-end'}}>
                <Text style={[styles.strikeText, {color: user.strikes >= 4 ? '#EF4444' : '#F59E0B'}]}>{user.strikes}/5 Strikes</Text>
                <View style={styles.barBase}><View style={[styles.barFill, {width: `${(user.strikes/5)*100}%`, backgroundColor: user.strikes >= 4 ? '#EF4444' : '#F59E0B'}]} /></View>
                <TouchableOpacity style={[styles.liftBtn, {marginTop: 6}]} onPress={() => handleLiftStrikes(user.uid)}>
                  <UserCheck size={16} color="#059669" />
                  <Text style={styles.liftText}>Reset Strikes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })}

      <Text style={[styles.sectionLabel, {marginTop: 30}]}>Banned Users</Text>
      {bannedUsers.length === 0 && (
        <Text style={[styles.emptyText, darkMode && {color: 'white'}]}>No banned users.</Text>
      )}
      {bannedUsers.map(user => (
        <View key={user.uid} style={[styles.listItem, darkMode && styles.cardDark]}>
          <View>
            <Text style={[styles.itemText, darkMode && {color: 'white'}]}>{user.email || user.uid}</Text>
            <Text style={styles.offSub}>{user.banReason || 'Banned'}</Text>
            <Text style={styles.offSub}>Strikes: {user.strikes} / 5</Text>
          </View>
          <TouchableOpacity style={styles.liftBtn} onPress={() => handleLiftBan(user.uid)}><UserCheck size={16} color="#059669" /><Text style={styles.liftText}>Lift</Text></TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const MenuBtn = ({ icon: Icon, label, count, color, darkMode, onPress }) => (
  <TouchableOpacity style={[styles.menuItem, darkMode && styles.cardDark]} onPress={onPress}>
    <View style={[styles.iconCircle, {backgroundColor: `${color}15`}]}><Icon size={20} color={color} /></View>
    <View style={{flex: 1}}><Text style={[styles.menuLabel, darkMode && {color: 'white'}]}>{label}</Text><Text style={styles.menuSub}>{count} Active</Text></View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 25 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 },
  subTitle: { fontSize: 16, fontWeight: 'bold' },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 18, borderRadius: 15, marginBottom: 12, elevation: 2 },
  iconCircle: { width: 45, height: 45, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuLabel: { fontWeight: 'bold', fontSize: 16 },
  menuSub: { fontSize: 11, color: '#9CA3AF' },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 15, marginBottom: 10 },
  itemText: { fontWeight: 'bold' },
  cardDark: { backgroundColor: '#1F2937' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 10 },
  addCard: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginTop: 10 },
  addLabel: { fontWeight: 'bold', marginBottom: 8 },
  addRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, marginRight: 10 },
  inputDark: { backgroundColor: '#111827', color: 'white' },
  addBtn: { backgroundColor: '#1E88E5', padding: 12, borderRadius: 10 },
  sectionLabel: { fontSize: 11, fontWeight: 'bold', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 15 },
  offenderCard: { backgroundColor: 'white', padding: 15, borderRadius: 15, marginBottom: 10 },
  offRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  offId: { fontWeight: 'bold' },
  offSub: { fontSize: 11, color: '#9CA3AF' },
  strikeText: { fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  barBase: { width: 100, height: 5, backgroundColor: '#F3F4F6', borderRadius: 3 },
  barFill: { height: '100%', borderRadius: 3 },
  liftBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  liftText: { color: '#059669', fontSize: 11, fontWeight: 'bold', marginLeft: 5 },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalBody: { padding: 20, maxHeight: 400 },
  modalFooter: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB', gap: 10 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6, marginTop: 12 },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  inputSmall: { marginBottom: 10, marginRight: 0 },
  coordRow: { flexDirection: 'row' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 8, gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold' },
  helpText: { fontSize: 12, color: '#9CA3AF', marginBottom: 12 },
  areaCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 12, borderRadius: 10, marginBottom: 8 },
  areaCardEditing: { borderWidth: 2, borderColor: '#F59E0B' },
  areaName: { fontWeight: '600', marginBottom: 2 },
  areaCoords: { fontSize: 11, color: '#9CA3AF' },
  tapToEdit: { fontSize: 10, color: '#9CA3AF', fontStyle: 'italic', marginTop: 2 },
  removeBtn: { padding: 8 },
  areaFormHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cancelEditText: { color: '#EF4444', fontSize: 12, fontWeight: '600' },
  updateAreaBtn: { backgroundColor: '#10B981' },
  addAreaCard: { backgroundColor: '#F3F4F6', padding: 15, borderRadius: 12, marginTop: 10, marginBottom: 30 },
  addAreaTitle: { fontWeight: 'bold', marginBottom: 10 },
  addAreaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F59E0B', padding: 10, borderRadius: 10, marginTop: 5, gap: 6 },
  addAreaBtnText: { color: 'white', fontWeight: 'bold' },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  cancelBtnText: { fontWeight: '600', color: '#6B7280' },
  saveBtn: { flex: 1, backgroundColor: '#1E88E5', padding: 14, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: 'bold' },
  // Department card styles  
  deptCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 15, marginBottom: 10, elevation: 1 },
  deptDesc: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  areaTag: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  areaTagText: { fontSize: 11, color: '#F59E0B', fontWeight: '500' }
});