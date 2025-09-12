import { useEffect, useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { getCurrentUser, updateUser } from "../../services/api";
import type { User } from "../../types";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function UserInfoCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const { user, updateUser: updateUserContext } = useAuth();
  const [formData, setFormData] = useState<Partial<User>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await getCurrentUser();
        if (res.data.success) {
          updateUserContext(res.data.data ?? {});
          setFormData(res.data.data ?? {});
        }
      } catch (err) {
        console.error("Failed to fetch user", err);
        toast.error("Không thể tải thông tin người dùng");
      }
    }
    fetchUser();
  }, [updateUserContext]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      const res = await updateUser(user._id, formData);
      if (res.data.success) {
        updateUserContext(res.data.data ?? {});
        toast.success("Cập nhật thông tin thành công!");
        closeModal();
      } else {
        toast.error(res.data.message || "Cập nhật thất bại!");
      }
    } catch (err: any) {
      console.error("Update failed", err);
      toast.error(err.response?.data?.message || "Có lỗi xảy ra!");
    }
  };

  const handleUploadAvatar = (file: File) => {
    if (!user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ảnh không được vượt quá 2MB!");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        setPreviewImage(base64String);

        const res = await updateUser(user._id, { image: base64String });
        if (res.data.success) {
          updateUserContext(res.data.data ?? {});
          toast.success("Ảnh đại diện đã được cập nhật!");
        } else {
          toast.error(res.data.message || "Cập nhật ảnh thất bại!");
        }
      } catch (err: any) {
        console.error("Upload avatar failed", err);
        toast.error(err.response?.data?.message || "Có lỗi xảy ra!");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-6 border border-gray-200 rounded-2xl dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
      {/* Avatar + Change photo */}
      <div className="flex items-center gap-6 mb-6">
        <div className="w-20 h-20 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
          {previewImage || user?.image ? (
            <img
              src={previewImage || user?.image}
              alt="user"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold">
              {user?.fullName?.charAt(0) || "?"}
            </div>
          )}
        </div>
        <div>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUploadAvatar(file);
            }}
          />
          <button
            type="button"
            onClick={() => document.getElementById("avatar-upload")?.click()}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Change Photo
          </button>
          <p className="text-xs text-gray-500 mt-1">JPG, PNG hoặc GIF (tối đa 2MB)</p>
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-gray-500">Full Name</p>
          <p className="font-medium text-gray-800 dark:text-gray-200">{user?.fullName || "N/A"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Email</p>
          <p className="font-medium text-gray-800 dark:text-gray-200">{user?.email || "N/A"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Phone</p>
          <p className="font-medium text-gray-800 dark:text-gray-200">{user?.phone || "N/A"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Address</p>
          <p className="font-medium text-gray-800 dark:text-gray-200">{user?.address || "N/A"}</p>
        </div>
      </div>

      {/* Edit Profile button */}
      <div className="mt-6">
        <button
          type="button"
          onClick={openModal}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90"
        >
          Edit Profile
        </button>
      </div>

      {/* Modal chỉnh sửa */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-xl m-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6">
          <h4 className="mb-4 text-xl font-semibold">Edit Personal Information</h4>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Full Name</Label>
              <Input name="fullName" type="text" value={formData.fullName || ""} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input name="email" type="email" value={formData.email || ""} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input name="phone" type="text" value={formData.phone || ""} onChange={handleChange} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Address</Label>
              <Input name="address" type="text" value={formData.address || ""} onChange={handleChange} />
            </div>
          </form>
          <div className="flex justify-end mt-6 gap-3">
            <button onClick={closeModal} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200">
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
              Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
