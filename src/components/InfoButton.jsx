import React, { useState, memo } from "react";
import { Info, X, XCircle, Users } from "@phosphor-icons/react";

// Memoized TeamMember component to prevent unnecessary re-renders
const TeamMember = memo(({ image, name, alt }) => (
  <li className="flex items-center space-x-4 p-3 bg-gray-100 rounded-lg shadow">
    <img
      className="w-12 h-12 rounded-full object-cover"
      src={image}
      alt={alt}
      loading="lazy" // Lazy load images for better performance
    />
    <span className="text-lg font-semibold">{name}</span>
  </li>
));

// Memoized ConnectedUser component to display a connected user
const ConnectedUser = memo(({ user }) => (
  <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold"
      style={{ backgroundColor: user.color }}
    >
      {user.initial}
    </div>
    <span className="text-sm font-medium">User {user.id.substring(0, 6)}</span>
  </div>
));

// Team data extracted for better maintainability
const teamMembers = [
  {
    id: 1,
    name: "Vivek VV",
    image: "https://ca.slack-edge.com/TGC0CDGVB-U02SJ1M5XHS-a27ef4c9dd96-512",
    alt: "Vivek VV",
  },
  {
    id: 2,
    name: "Sreelekshmi C P",
    image: "https://ca.slack-edge.com/TGC0CDGVB-U015RF2SX7G-ca9c08131ec6-512",
    alt: "Sreelekshmi C P",
  },
  {
    id: 3,
    name: "Sreejith A",
    image: "https://ca.slack-edge.com/TGC0CDGVB-U04MFSJS52P-8a12f22e7426-512",
    alt: "Sreejith A",
  },
  {
    id: 4,
    name: "Sharon Thomas",
    image: "https://ca.slack-edge.com/TGC0CDGVB-U03EXQ0P3TM-931b877fd4b5-512",
    alt: "Sharon Thomas",
  },
  {
    id: 5,
    name: "Manikandan R",
    image: "https://ca.slack-edge.com/TGC0CDGVB-U02J06U6XLG-90da7605e88b-512",
    alt: "Manikandan R",
  },
];

// Memoized Modal component to prevent unnecessary re-renders
const Modal = memo(({ isOpen, onClose, connectedUsers = [] }) => {
  if (!isOpen) return null;

  // Handle click outside to close modal
  const handleBackdropClick = (e) => {
    if (e.target.id === "modal-backdrop") {
      onClose();
    }
  };

  return (
    <div
      id="modal-backdrop"
      className="fixed inset-0 flex items-center justify-center bg-black/70 z-[9999]"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white p-6 md:p-10 rounded-lg shadow-lg w-full max-w-2xl mx-4 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-3 cursor-pointer"
          onClick={onClose}
          aria-label="Close modal"
        >
          <XCircle size={32} weight="fill" color="#99a1af" />
        </button>

        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
          SyncBoard
        </h2>

        <p className="text-center mb-6 md:mb-10 text-sm md:text-base">
          A real-time whiteboard is a collaborative digital workspace that
          allows multiple users to draw, write, and share ideas simultaneously.
          It provides a seamless experience for brainstorming, teaching, remote
          meetings, and project planning.
        </p>

        {/* Connected Users Section */}
        {connectedUsers.length > 0 && (
          <section className="mb-8">
            <h3 className="text-lg md:text-xl font-bold mb-4 flex items-center justify-center">
              <Users size={20} className="mr-2" />
              Currently Connected ({connectedUsers.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {connectedUsers.map((user) => (
                <ConnectedUser key={user.id} user={user} />
              ))}
            </div>
          </section>
        )}

        <section className="flex flex-col">
          <h3 className="text-lg md:text-xl font-bold mb-4 text-center">
            Our Team
          </h3>
          <div className="mt-4 md:mt-6 w-full">
            <ul className="grid w-full grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {teamMembers.map((member) => (
                <TeamMember
                  key={member.id}
                  image={member.image}
                  name={member.name}
                  alt={member.alt}
                />
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
});

const InfoButton = ({ connectedUsers = [] }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <>
      <button
        className="fixed right-10 top-4 z-[9998] rounded-full shadow-md transition-colors duration-200 cursor-pointer"
        onClick={handleOpenModal}
        aria-label="Show information"
        title="About SyncBoard"
      >
        <Info size={24} weight="fill" color="#99a1af" />
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        connectedUsers={connectedUsers}
      />
    </>
  );
};

export default InfoButton;
