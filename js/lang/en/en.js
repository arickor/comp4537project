const messages = {
  success: {
    updateColor: 'Color data updated successfully!',
    addColor: 'Color data added successfully!',
    deleteColor: 'Color data deleted successfully!',
    logout: 'Successfully logged out.',
    register: 'Successfully registered!',
    answer: 'Answer verified successfully.',
    resetPassword: 'Password reset successfully.',
  },
  error: {
    authorization: 'Unauthorized - access failed.',
    route: 'Route not found.',
    fetchColor: 'Failed to fetch color data.',
    editColor: 'Failed to edit color data.',
    deleteColor: 'Failed to delete color data.',
    register: 'Registration failed. Please try again.',
    emailNotFound: 'Email is not found.',
    userNotFound: 'User not found.',
    apiStats: 'Failed to fetch API statistics.',
    answer: 'Please provide a correct answer.',
    resetPassword: 'Failed to reset password.',
  },
};

module.exports = messages;
