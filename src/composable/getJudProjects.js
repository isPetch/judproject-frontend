const token = localStorage.getItem('token');
const getAllProjects = async () => {
  try {
    const token = localStorage.getItem('token'); // ดึง token จาก localStorage
    if (!token) throw new Error('User not authenticated');

    const res = await fetch(import.meta.env.VITE_ROOT_API + '/api/projects', {
      method: 'GET',
      headers: {
        "Authorization": token, // ใช้ token ที่ดึงมาได้
        "Content-Type": "application/json"
      },
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    } else {
      throw new Error('Error, cannot get data!');
    }
  } catch (error) {
    console.error(error);
    return [];
  }
};
  const getProjectById = async (id) => {
    try {
      const res = await fetch(import.meta.env.VITE_ROOT_API + "/api/project/" + id, {
        method: 'GET',
        headers: {
          "Authorization": token,
        }
      });
  
      if (res.ok) {
        const data = await res.json();
        console.log('Project Data:', data);  // ตรวจสอบข้อมูลที่ดึงมาจาก API
        return data;
      } else {
        throw new Error('Error, cannot get data!');
      }
    } catch (error) {
      console.log('Fetch error:', error);
      return null;
    }
  };
  const getSprintById = async (id) => {
    try {
      const res = await fetch(import.meta.env.VITE_ROOT_API + "/api/sprint/" + id, {
        method: 'GET',
        headers: {
          "Authorization": token,
        }
      });
  
      if (res.ok) {
        const data = await res.json();
        console.log('Sprint Data:', data);  // ตรวจสอบข้อมูลที่ดึงมาจาก API
        return data;
      } else {
        throw new Error('Error, cannot get data!');
      }
    } catch (error) {
      console.log('Fetch error:', error);
      return null;
    }
  };
  const getUserById = async (id) => {
    try {
      const res = await fetch(import.meta.env.VITE_ROOT_API + "/api/profile" , {
        method: 'GET',
        headers: {
           'Authorization': id
        }
      });
  
      if (res.ok) {
        const data = await res.json();
        console.log('User Data:', data);  // ตรวจสอบข้อมูลที่ดึงมาจาก API
        return data;
      } else {
        throw new Error('Error, cannot get data!');
      }
    } catch (error) {
      console.log('Fetch error:', error);
      return null;
    }
  };
  const getAllUsers = async (id) => {
    try {
      const res = await fetch(import.meta.env.VITE_ROOT_API + "/api/admin/users" , {
        method: 'GET',
      });
  
      if (res.ok) {
        const data = await res.json();
        console.log('User Data:', data);  // ตรวจสอบข้อมูลที่ดึงมาจาก API
        return data;
      } else {
        throw new Error('Error, cannot get data!');
      }
    } catch (error) {
      console.log('Fetch error:', error);
      return null;
    }
  };
  
  export { getAllProjects,getProjectById,getSprintById,getUserById,getAllUsers };