import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { organogramAPI } from '../services/api';
import { ChevronUpIcon, ChevronDownIcon, UserIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

export default function Organogram() {
  const { user } = useAuth();
  const [hierarchyData, setHierarchyData] = useState(null);
  const [currentManager, setCurrentManager] = useState(null);
  const [peers, setPeers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [animating, setAnimating] = useState(false);
  const [navigationHistory, setNavigationHistory] = useState([]);

  useEffect(() => {
    fetchHierarchyData();
  }, []);

  const fetchHierarchyData = async () => {
    try {
      setLoading(true);
      const response = await organogramAPI.getMyHierarchy();
      console.log('=== ORGANOGRAM RESPONSE ===', response.data);
      
      if (response.data.success) {
        const data = response.data.data;
        console.log('Hierarchy Data:', data);
        console.log('Current Employee:', data.currentEmployee);
        console.log('Current Employee Full Object:', JSON.stringify(data.currentEmployee?.employee, null, 2));
        console.log('Immediate Manager:', data.immediateManager);
        console.log('Manager Employee Full Object:', JSON.stringify(data.immediateManager?.employee, null, 2));
        
        setHierarchyData(data);
        setCurrentManager(data.immediateManager);
        
        // Get peers (employees under same manager)
        const myNode = data.currentEmployee;
        if (myNode && data.immediateManager) {
          const allPeers = data.immediateManager.children || [];
          console.log('Peers:', allPeers);
          if (allPeers.length > 0) {
            console.log('First Peer Employee Object:', JSON.stringify(allPeers[0]?.employee, null, 2));
          }
          setPeers(allPeers);
        } else {
          console.log('No manager, setting self as peer');
          setPeers(myNode ? [myNode] : []);
        }
      }
    } catch (error) {
      console.error('Error fetching hierarchy:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateUp = async () => {
    if (!currentManager || animating) return;
    
    setAnimating(true);
    
    // Save current state to history
    setNavigationHistory([...navigationHistory, { manager: currentManager, peers: peers }]);
    
    // Find the parent of current manager
    const parentNode = hierarchyData.hierarchy.find(node => 
      node.nodeId === currentManager.parentId
    );
    
    if (parentNode) {
      // Get all children of the parent (siblings of current manager)
      const newPeers = parentNode.children || [];
      
      setTimeout(() => {
        setCurrentManager(parentNode);
        setPeers(newPeers);
        setAnimating(false);
      }, 300);
    } else {
      // Current manager is at top level
      setAnimating(false);
    }
  };

  const navigateDown = async () => {
    if (navigationHistory.length === 0 || animating) return;
    
    setAnimating(true);
    
    // Get the last state from history
    const lastState = navigationHistory[navigationHistory.length - 1];
    const newHistory = navigationHistory.slice(0, -1);
    
    setTimeout(() => {
      setCurrentManager(lastState.manager);
      setPeers(lastState.peers);
      setNavigationHistory(newHistory);
      setAnimating(false);
    }, 300);
  };

  const getEmployeeInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const getEmployeePhoto = (employee) => {
    // Check multiple possible photo field names
    if (employee?.profilePictureUrl) return employee.profilePictureUrl;
    if (employee?.profilePhoto) return employee.profilePhoto;
    if (employee?.profilePhotoUrl) return employee.profilePhotoUrl;
    if (employee?.photo) return employee.photo;
    if (employee?.photoUrl) return employee.photoUrl;
    if (employee?.image) return employee.image;
    if (employee?.imageUrl) return employee.imageUrl;
    return null;
  };

  const renderEmployeeCard = (node, isCurrentUser = false) => {
    const employee = node?.employee;
    const employeeName = employee?.fullName || employee?.name || 'Vacant';
    const photoUrl = getEmployeePhoto(employee);

    console.log('Rendering card for:', employeeName, 'Photo URL:', photoUrl);

    return (
      <div 
        key={node?.nodeId}
        className={`
          w-48 bg-white rounded-2xl shadow-lg border 
          ${isCurrentUser ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'} 
          p-4 flex flex-col items-center 
          hover:shadow-xl transition-all duration-300 
          relative
        `}
      >
        {/* Employee Photo/Avatar */}
        <div className="w-20 h-20 mb-3 relative">
          {photoUrl ? (
            <img 
              src={photoUrl}
              alt={employeeName}
              className="w-full h-full rounded-full object-cover border-3 border-white shadow-lg"
              onError={(e) => {
                console.log('Image failed to load:', photoUrl);
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg"
            style={{ display: photoUrl ? 'none' : 'flex' }}
          >
            {employeeName !== 'Vacant' ? getEmployeeInitials(employeeName) : <UserIcon className="w-8 h-8" />}
          </div>
          {isCurrentUser && (
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
              <span className="text-white text-xs font-bold">Me</span>
            </div>
          )}
        </div>

        {/* Employee Info */}
        <div className="text-center w-full">
          <h3 className="font-bold text-gray-900 mb-1 text-sm truncate">
            {employeeName}
          </h3>
          <p className="text-xs text-gray-600 mb-1">
            {node?.position || 'Position'}
          </p>
          {employee?.department && (
            <p className="text-xs text-blue-600 font-medium">
              {employee.department}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderHierarchyView = () => {
    if (!hierarchyData) return null;

    const canGoUp = currentManager && currentManager.parentId;
    const canGoDown = navigationHistory.length > 0;

    return (
      <div className="flex flex-col items-center space-y-8 py-8">
        {/* Navigation Arrows */}
        <div className="flex items-center gap-4">
          {/* Up Arrow */}
          {canGoUp && (
            <button
              onClick={navigateUp}
              disabled={animating}
              className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              title="View Higher Level"
            >
              <ChevronUpIcon className="w-6 h-6" />
            </button>
          )}
          
          {/* Down Arrow */}
          {canGoDown && (
            <button
              onClick={navigateDown}
              disabled={animating}
              className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              title="Go Back Down"
            >
              <ChevronDownIcon className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Manager Card */}
        <div className={`transition-all duration-300 ${animating ? 'opacity-0 transform -translate-y-4' : 'opacity-100'}`}>
          {currentManager && (
            <div className="flex flex-col items-center">
              {renderEmployeeCard(currentManager, currentManager.employeeId === user?.employeeId)}
              <div className="text-sm text-gray-500 mt-2 font-medium">
                {currentManager.position}
              </div>
            </div>
          )}
        </div>

        {/* Connecting Line */}
        {currentManager && peers.length > 0 && (
          <div className="w-px h-12 bg-gray-300"></div>
        )}

        {/* Peers (Same Level Employees) */}
        <div className={`transition-all duration-300 ${animating ? 'opacity-0 transform translate-y-4' : 'opacity-100'}`}>
          {peers.length > 0 && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-6 flex-wrap justify-center max-w-6xl">
                {peers.map((peer, index) => (
                  <div key={peer.nodeId} className="flex flex-col items-center">
                    {renderEmployeeCard(peer, peer.employeeId === user?.employeeId)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading organization chart...</span>
      </div>
    );
  }

  if (!hierarchyData) {
    return (
      <div className="text-center py-12">
        <BuildingOfficeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Organization Data</h3>
        <p className="text-gray-600">You are not currently assigned to any position in the organization chart.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-full">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Organization Chart</h1>
          <p className="text-sm text-gray-600 mt-1">
            Navigate through your reporting structure
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6">
        {renderHierarchyView()}
      </div>
    </div>
  );
}
