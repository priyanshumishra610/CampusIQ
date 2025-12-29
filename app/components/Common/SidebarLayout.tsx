/**
 * SidebarLayout Component
 * 
 * Wraps navigation content with a responsive sidebar.
 * On mobile: Uses drawer navigation
 * On tablet/desktop: Fixed sidebar with content area
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Sidebar from './Sidebar';
import {Colors, Spacing} from '../../theme/designTokens';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH >= 768;
const SIDEBAR_WIDTH = 280;
const SIDEBAR_COLLAPSED_WIDTH = 72;

interface SidebarLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  onSidebarToggle?: () => void;
}

const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  children,
  showSidebar = true,
  onSidebarToggle,
}) => {
  const navigation = useNavigation();
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(IS_TABLET);

  useEffect(() => {
    // On mobile, sidebar starts hidden (drawer mode)
    // On tablet/desktop, sidebar is always visible
    setSidebarVisible(IS_TABLET || showSidebar);
  }, [showSidebar]);

  const handleToggleCollapse = () => {
    if (IS_TABLET) {
      setCollapsed(!collapsed);
    } else {
      // On mobile, toggle drawer
      if (onSidebarToggle) {
        onSidebarToggle();
      } else {
        // @ts-ignore - drawer navigation methods
        navigation.toggleDrawer?.();
      }
    }
  };

  const handleNavigate = (route: string) => {
    try {
      navigation.navigate(route as never);
      // Close drawer on mobile after navigation
      if (!IS_TABLET) {
        // @ts-ignore
        navigation.closeDrawer?.();
      }
    } catch (error) {
      console.warn(`Navigation to ${route} failed:`, error);
    }
  };

  // Mobile: Drawer mode (sidebar overlays content)
  if (!IS_TABLET) {
    return (
      <View style={styles.container}>
        {/* Mobile Header with Menu Button */}
        <View style={styles.mobileHeader}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={handleToggleCollapse}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Icon name="menu" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
        {children}
      </View>
    );
  }

  // Tablet/Desktop: Fixed sidebar with content area
  return (
    <View style={styles.container}>
      {sidebarVisible && (
        <View
          style={[
            styles.sidebarContainer,
            {width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH},
          ]}>
          <Sidebar
            collapsed={collapsed}
            onToggleCollapse={handleToggleCollapse}
            onNavigate={handleNavigate}
          />
        </View>
      )}
      <View
        style={[
          styles.contentContainer,
          sidebarVisible && {
            marginLeft: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
          },
        ]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.background,
  },
  sidebarContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  contentContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mobileHeader: {
    height: 56,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  menuButton: {
    padding: Spacing.xs,
  },
});

export default SidebarLayout;

