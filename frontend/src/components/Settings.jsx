import React, { useEffect, useState } from 'react';
import { getProfile, updateProfile } from '../services/api';
import toast from 'react-hot-toast';
import styles from '../styles/App.module.css';

function Settings() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [hasExistingAvatar, setHasExistingAvatar] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getProfile();
        setFormData({
          first_name: response.data.first_name || '',
          last_name: response.data.last_name || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
        });
        if (response.data.avatar) {
          setPreview(response.data.avatar);
          setHasExistingAvatar(true);
        }
      } catch (error) {
        console.error('خطا در دریافت اطلاعات پروفایل', error);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setRemoveAvatar(false);
    }
  };

  const handleDeleteAvatar = () => {
    setFile(null);
    setPreview(null);
    setRemoveAvatar(true);
    setHasExistingAvatar(false);
  };

  const handleSave = async () => {
    const data = new FormData();
    
    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key] !== null ? formData[key] : '');
    });

    if (removeAvatar) {
      data.append('remove_avatar', 'true'); 
    } else if (file) {
      data.append('avatar', file);
    }

    try {
      const response = await updateProfile(data);
      toast.success('پروفایل با موفقیت به‌روزرسانی شد');
      setRemoveAvatar(false);
      setFile(file);
      
      if (response.data.avatar) {
        setPreview(response.data.avatar);
        setHasExistingAvatar(true);
      } else {
        setPreview(null);
        setHasExistingAvatar(false);
      }
    } catch (error) {
      console.error(error);
      toast.error('خطا در ذخیره‌سازی اطلاعات');
    }
  };

  return (
    <div className={styles.settingsCard}>
      <h2 className={styles.title}>تنظیمات پروفایل</h2>
      
      <div className={styles.avatarSection}>
        <img src={preview || '/default-avatar.png'} alt="Profile" className={styles.avatar} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className={styles.uploadBtn}>
            تغییر عکس
            <input type="file" hidden accept="image/*" onChange={handleFileChange} />
          </label>
          {(preview || hasExistingAvatar) && !removeAvatar && (
            <button type="button" onClick={handleDeleteAvatar} className={styles.deleteAvatar}>
              حذف عکس
            </button>
          )}
        </div>
      </div>
      
      <div className={styles.formG}>
        <input 
          name="first_name" 
          placeholder="نام" 
          value={formData.first_name} 
          onChange={handleChange} 
          className={styles.input} 
        />
        <input 
          name="last_name" 
          placeholder="نام خانوادگی" 
          value={formData.last_name} 
          onChange={handleChange} 
          className={styles.input} 
        />
        <input 
          name="email" 
          placeholder="ایمیل" 
          type="email" 
          value={formData.email} 
          onChange={handleChange} 
          className={styles.input} 
        />
        <input 
          name="phone" 
          placeholder="شماره تماس" 
          value={formData.phone} 
          onChange={handleChange} 
          className={styles.input} 
        />
      </div>

      <button onClick={handleSave} className={styles.saveBtn}>ذخیره تغییرات</button>
    </div>
  );
}

export default Settings;