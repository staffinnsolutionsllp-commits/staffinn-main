import React, { useState } from 'react';
import apiService from '../../services/api';
import { getSectors, getRolesForSector } from '../../utils/sectorRoleData';

const TestSearch = () => {
    const [selectedSector, setSelectedSector] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [availableRoles, setAvailableRoles] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const sectors = getSectors();

    const handleSectorChange = (e) => {
        const sector = e.target.value;
        setSelectedSector(sector);
        
        if (sector) {
            const roles = getRolesForSector(sector);
            setAvailableRoles(roles);
            setSelectedRole('');
        } else {
            setAvailableRoles([]);
            setSelectedRole('');
        }
    };

    const handleSearch = async () => {
        try {
            setIsSearching(true);
            
            const searchParams = {
                sector: selectedSector,
                role: selectedRole
            };
            
            console.log('Search params:', searchParams);
            
            const response = await apiService.searchStaff(searchParams);
            
            if (response.success) {
                setSearchResults(response.data);
                console.log('Search results:', response.data);
            } else {
                console.error('Search failed:', response.message);
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>Test Staff Search</h1>
            
            <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '10px' }}>
                    <label>Select Sector:</label>
                    <select 
                        value={selectedSector} 
                        onChange={handleSectorChange}
                        style={{ marginLeft: '10px', padding: '5px', width: '300px' }}
                    >
                        <option value="">Select Sector</option>
                        {sectors.map((sector, index) => (
                            <option key={index} value={sector}>{sector}</option>
                        ))}
                    </select>
                </div>
                
                <div style={{ marginBottom: '10px' }}>
                    <label>Select Role:</label>
                    <select 
                        value={selectedRole} 
                        onChange={(e) => setSelectedRole(e.target.value)}
                        disabled={!selectedSector}
                        style={{ marginLeft: '10px', padding: '5px', width: '300px' }}
                    >
                        <option value="">Select Role</option>
                        {availableRoles.map((role, index) => (
                            <option key={index} value={role}>{role}</option>
                        ))}
                    </select>
                </div>
                
                <button 
                    onClick={handleSearch} 
                    disabled={isSearching}
                    style={{ 
                        padding: '10px 20px', 
                        backgroundColor: '#4863f7', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    {isSearching ? 'Searching...' : 'Search'}
                </button>
            </div>
            
            <div>
                <h2>Search Results ({searchResults.length})</h2>
                {searchResults.length > 0 ? (
                    <div>
                        {searchResults.map((staff, index) => (
                            <div key={staff.userId || index} style={{ 
                                border: '1px solid #ddd', 
                                padding: '15px', 
                                marginBottom: '10px',
                                borderRadius: '5px'
                            }}>
                                <h3>{staff.fullName}</h3>
                                <p><strong>Sector:</strong> {staff.sector || 'Not specified'}</p>
                                <p><strong>Role:</strong> {staff.role || 'Not specified'}</p>
                                <p><strong>Skills:</strong> {staff.skills || 'Not specified'}</p>
                                <p><strong>Address:</strong> {staff.address || 'Not specified'}</p>
                                <p><strong>Phone:</strong> {staff.phone || 'Not specified'}</p>
                                <p><strong>Email:</strong> {staff.email || 'Not specified'}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>No results found. Try different search criteria.</p>
                )}
            </div>
        </div>
    );
};

export default TestSearch;