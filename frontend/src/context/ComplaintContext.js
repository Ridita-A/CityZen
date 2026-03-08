import React, { createContext, useState, useContext } from 'react';

const ComplaintContext = createContext();

export const useComplaint = () => useContext(ComplaintContext);

export const ComplaintProvider = ({ children }) => {
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState(null);
  const [locationTime, setLocationTime] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [assignedAuthorities, setAssignedAuthorities] = useState([]);
  const [unknownCategoryLabel, setUnknownCategoryLabel] = useState(null); // AI label not found in DB
  const [unknownCategoryDescription, setUnknownCategoryDescription] = useState(null); // AI description for the new category
  const [isDraftMode, setIsDraftMode] = useState(false); // If complaint is being submitted as draft 

  const resetState = () => {
    setImages([]);
    setLocation(null);
    setLocationTime(null);
    setTitle('');
    setDescription('');
    setSelectedCategory(null);
    setAiResult(null);
    setAssignedAuthorities([]);
    setUnknownCategoryLabel(null);
    setUnknownCategoryDescription(null);
    setIsDraftMode(false);
  };
  
  const value = {
    images,
    setImages,
    location,
    setLocation,
    locationTime,
    setLocationTime,
    aiResult,
    setAiResult,
    title,
    setTitle,
    description,
    setDescription,
    selectedCategory,
    setSelectedCategory,
    assignedAuthorities,
    setAssignedAuthorities,
    unknownCategoryLabel,
    setUnknownCategoryLabel,
    unknownCategoryDescription,
    setUnknownCategoryDescription,
    isDraftMode,
    setIsDraftMode,
    resetState,
  };

  return (
    <ComplaintContext.Provider value={value}>
      {children}
    </ComplaintContext.Provider>
  );
};
