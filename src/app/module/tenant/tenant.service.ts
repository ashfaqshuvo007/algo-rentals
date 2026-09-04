import { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";

const uploadProfileImage = async (fileToUpload: Buffer, userId: string) => {
	// Get the existing user to check for an old image
	const existingUser = await prisma.user.findUnique({
		where: { id: userId },
		select: { imagePublicId: true },
	});

	// Wait for Cloudinary upload to complete
	const cloudinaryResult = await new Promise<UploadApiResponse>(
		(resolve, reject) => {
			cloudinary.uploader
				.upload_stream(
					{
						resource_type: "image",
					},
					(error, result) => {
						if (error) {
							console.log(error);
							reject(new Error(error.message));
							return;
						}
						if (!result) {
							reject(new Error("No Result From Cloudinary."));
							return;
						}
						resolve(result);
					},
				)
				.end(fileToUpload);
		},
	);

	// Update DB with new image info
	const updatedUser = await prisma.user.update({
		where: {
			id: userId,
		},
		data: {
			imageUrl: cloudinaryResult.secure_url,
			imagePublicId: cloudinaryResult.public_id,
		},
		omit: {
			password: true,
		},
	});

	// Delete old image from Cloudinary, if it existed
	if (existingUser?.imagePublicId) {
		try {
			await cloudinary.uploader.destroy(existingUser.imagePublicId);
		} catch (destroyError) {
			// Log but don't fail the whole operation — new image is already saved
			console.log("Failed to delete old Cloudinary image:", destroyError);
		}
	}

	return updatedUser;
};

const uploadNid = async (fileToUpload: Buffer, userId: string, nId: string) => {
	// Get the existing user to check for an old nid file
	const existingTenant = await prisma.tenant.findUnique({
		where: { userId: userId },
		select: { nidUrlPublicId: true },
	});

	// Wait for Cloudinary upload to complete
	const cloudinaryResult = await new Promise<UploadApiResponse>(
		(resolve, reject) => {
			cloudinary.uploader
				.upload_stream(
					{
						resource_type: "image",
					},
					(error, result) => {
						if (error) {
							console.log(error);
							reject(new Error(error.message));
							return;
						}
						if (!result) {
							reject(new Error("No Result From Cloudinary."));
							return;
						}
						resolve(result);
					},
				)
				.end(fileToUpload);
		},
	);

	// Update DB with new  info
	const updatedTenant = await prisma.tenant.update({
		where: {
			userId: userId,
		},
		data: {
			nidNumber: nId,
			nidUrl: cloudinaryResult.secure_url,
			nidUrlPublicId: cloudinaryResult.public_id,
		},
		omit: {
			nidNumber: true,
		},
	});

	// Delete old image from Cloudinary, if it existed
	if (existingTenant?.nidUrlPublicId) {
		try {
			await cloudinary.uploader.destroy(existingTenant.nidUrlPublicId);
		} catch (destroyError) {
			// Log but don't fail the whole operation — new image is already saved
			console.log("Failed to delete old Cloudinary file:", destroyError);
		}
	}

	return updatedTenant;
};

export const TenantService = {
	uploadProfileImage,
	uploadNid,
};
