import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileAPI } from '../services/api';
import { User, Briefcase, Phone, Edit2, Save, X } from 'lucide-react';

export default function Profile() {
  const { user }  = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    phone: '', currentAddress: '',
    emergencyContactName: '', emergencyContactNumber: '', emergencyContactRelation: ''
  });

  useEffect(() => {
    if (user?.employee) {
      setFormData({
        phone:                    user.employee.phone || user.employee.emergencyContactNumber || '',
        currentAddress:           user.employee.currentAddress || '',
        emergencyContactName:     user.employee.emergencyContactName || '',
        emergencyContactNumber:   user.employee.emergencyContactNumber || '',
        emergencyContactRelation: user.employee.emergencyContactRelation || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await profileAPI.updateProfile(formData);
      alert('Profile updated successfully!');
      setEditing(false);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const employee = user?.employee || {};
  const initials = employee.fullName
    ? employee.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'E';

  const InfoRow = ({ label, value }) => (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm font-semibold text-slate-800">{value || <span className="text-slate-300 font-normal">—</span>}</p>
    </div>
  );

  const InputField = ({ label, type = 'text', value, onChange, textarea }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={onChange} rows="3"
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white resize-none" />
      ) : (
        <input type={type} value={value} onChange={onChange}
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white" />
      )}
    </div>
  );

  return (
    <div className="p-8 space-y-6 animate-fadeIn max-w-4xl">

      {/* Profile hero */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 text-white">
        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0 border-2 border-white/30">
          <span className="text-2xl font-black">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold truncate">{employee.fullName || 'Employee'}</h2>
          <p className="text-indigo-200 text-sm mt-0.5">
            {employee.designation}{employee.department ? ` · ${employee.department}` : ''}
          </p>
          <p className="text-indigo-300 text-xs mt-1">{employee.employeeId}</p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 border border-white/30 rounded-xl text-sm font-semibold transition-all"
        >
          {editing ? <><X size={14} /> Cancel</> : <><Edit2 size={14} /> Edit Profile</>}
        </button>
      </div>

      {!editing ? (
        <div className="space-y-5">
          {/* Personal */}
          <Section icon={<User size={16} className="text-indigo-500" />} title="Personal Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InfoRow label="Full Name"    value={employee.fullName} />
              <InfoRow label="Employee ID"  value={employee.employeeId} />
              <InfoRow label="Email"        value={employee.email} />
              <InfoRow label="Date of Birth" value={employee.dateOfBirth} />
              <InfoRow label="Blood Group"  value={employee.bloodGroup} />
              <InfoRow label="Phone"        value={employee.emergencyContactNumber} />
              <div className="sm:col-span-2">
                <InfoRow label="Address" value={employee.currentAddress} />
              </div>
            </div>
          </Section>

          {/* Employment */}
          <Section icon={<Briefcase size={16} className="text-indigo-500" />} title="Employment Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InfoRow label="Designation"      value={employee.designation} />
              <InfoRow label="Department"       value={employee.department} />
              <InfoRow label="Date of Joining"  value={employee.dateOfJoining} />
              <InfoRow label="Employment Type"  value={employee.employmentType} />
            </div>
          </Section>

          {/* Emergency */}
          <Section icon={<Phone size={16} className="text-indigo-500" />} title="Emergency Contact">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InfoRow label="Name"     value={employee.emergencyContactName} />
              <InfoRow label="Relation" value={employee.emergencyContactRelation} />
              <InfoRow label="Phone"    value={employee.emergencyContactNumber} />
            </div>
          </Section>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-bold text-slate-900 mb-5">Edit Profile</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Phone" type="tel" value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              <InputField label="Emergency Contact Name" value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })} />
              <InputField label="Emergency Contact Number" type="tel" value={formData.emergencyContactNumber}
                onChange={(e) => setFormData({ ...formData, emergencyContactNumber: e.target.value })} />
              <InputField label="Relation" value={formData.emergencyContactRelation}
                onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })} />
            </div>
            <InputField label="Current Address" value={formData.currentAddress}
              onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })} textarea />
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditing(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="submit"
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                <Save size={14} /> Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 card-hover">
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
        <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">{icon}</div>
        <h2 className="font-bold text-slate-800 text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );
}
