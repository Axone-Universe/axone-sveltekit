import { CommentProperties, label, type ChapterProperties } from '$lib/properties/chapter';
import mongoose, {
	Schema,
	model,
	type PipelineStage,
	type ClientSession,
	type HydratedDocument
} from 'mongoose';
import { label as BookLabel } from '$lib/properties/book';
import { label as StorylineLabel } from '$lib/properties/storyline';
import { label as UserLabel } from '$lib/properties/user';
import { label as DeltaLabel } from '$lib/properties/delta';
import {
	addUserPermissionPipeline,
	addViewRestrictionPipeline,
	addOwnerUpdateRestrictionFilter,
	permissionSchema,
	addArchivedRestrictionFilter,
	setUpdateDate
} from './permission';
import { Storyline } from './storyline';

interface ExtendedChapterProperties extends ChapterProperties {
	addChild: (chapterID: string, session: ClientSession) => Promise<void>;
	deleteChild: (chapterID: string, session: ClientSession) => Promise<void>;
	createComment: (comment: CommentProperties) => Promise<ChapterProperties>;
	deleteComment: (commentId: string) => Promise<string>;
}

export const commentSchema = new Schema<CommentProperties>({
	_id: String,
	date: String,
	userId: String,
	firstName: String,
	lastName: String,
	imageURL: String,
	comment: String
});

export const chapterSchema = new Schema<ExtendedChapterProperties>({
	_id: { type: String, required: true },
	book: { type: String, ref: BookLabel, required: true },
	storyline: { type: String, ref: StorylineLabel, required: true },
	user: { type: String, ref: UserLabel, required: true },
	delta: { type: String, ref: DeltaLabel },
	children: [{ type: String, ref: label }],
	permissions: { type: Map, of: permissionSchema },
	comments: [commentSchema],
	commentsCount: Number,
	title: String,
	description: String,
	archived: { type: Boolean, default: false },
	createdAt: Date,
	updatedAt: Date
});

chapterSchema.pre(['find', 'findOne'], function () {
	throw new Error('Please use aggregate.');
});

chapterSchema.pre('aggregate', function (next) {
	const userID = this.options.userID;
	const comments = this.options.comments;
	const storylineID = this.options.storylineID;
	const pipeline = this.pipeline();
	const postPipeline = this.options.postPipeline ?? [];

	populate(pipeline, comments);
	addUserPermissionPipeline(userID, pipeline);
	addViewRestrictionPipeline(userID, pipeline, 'storylines', 'storyline', storylineID);

	for (const filter of postPipeline) {
		pipeline.push(filter);
	}

	next();
});

chapterSchema.pre(['deleteOne', 'findOneAndDelete', 'findOneAndRemove'], function (next) {
	const userID = this.getOptions().userID;
	const filter = this.getFilter();

	const updatedFilter = addOwnerUpdateRestrictionFilter(userID, filter);
	this.setQuery(updatedFilter);

	next();
});

chapterSchema.pre(
	['updateOne', 'replaceOne', 'findOneAndReplace', 'findOneAndUpdate'],
	function (next) {
		const userID = this.getOptions().userID;
		const filter = this.getFilter();

		setUpdateDate(this.getUpdate());

		let updatedFilter = addOwnerUpdateRestrictionFilter(userID, filter);
		updatedFilter = addArchivedRestrictionFilter(updatedFilter);

		this.setQuery(updatedFilter);

		next();
	}
);

chapterSchema.pre('save', async function (next) {
	const userID = this.user as string;
	const storylineID = this.storyline as string;

	this.createdAt = this.updatedAt = new Date();

	const storyline = await Storyline.aggregate(
		[
			{
				$match: {
					_id: storylineID
				}
			}
		],
		{
			userID: userID
		}
	)
		.cursor()
		.next();

	if (storyline) {
		if (!storyline.userPermissions?.collaborate) {
			throw new Error('You have no permission to collaborate on this storyline');
		}

		if (storyline.archived) {
			throw new Error('This storyline is archived');
		}
	}

	next();
});

/**
 * Adding a child to chapter.children array cannot use findOneAndUpdate because of permission restrictions
 * Use this method instead, by calling addChild on the model instance
 * @param chapterID
 * @returns
 */
chapterSchema.methods.addChild = async function (chapterID: string, session: ClientSession) {
	this.children.push(chapterID);
	await this.save({ session });
};

chapterSchema.methods.deleteChild = async function (
	chapter: HydratedDocument<ChapterProperties>,
	session: ClientSession
) {
	this.children = this.children.filter((chapterID: string) => chapterID !== chapter._id);
	this.children = this.children.concat(chapter.children);
	await this.save({ session });
};

chapterSchema.methods.createComment = async function (comment: CommentProperties) {
	if (!this.comments) {
		this.comments = [];
	}

	this.comments.unshift(comment);
	return await this.save();
};

chapterSchema.methods.deleteComment = async function (commentId: string) {
	if (!this.comments) {
		this.comments = [];
	}

	this.comments = this.comments.filter((comment: { _id: string }) => comment._id !== commentId);
	return await this.save();
};

function populate(pipeline: PipelineStage[], comments: boolean) {
	pipeline.push(
		{
			$lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' }
		},
		{
			$unwind: {
				path: '$user',
				preserveNullAndEmptyArrays: true
			}
		}
	);

	pipeline.push(
		{
			$addFields: {
				permissionsArray: { $objectToArray: '$permissions' }
			}
		},
		{
			$lookup: {
				from: 'users',
				localField: 'permissionsArray.v.user',
				foreignField: '_id',
				as: 'permissionsUsers'
			}
		},
		{
			$unset: ['permissionsArray']
		}
	);

	// Initially only get 10 comments
	if (!comments) {
		pipeline.push({
			$set: {
				commentsCount: { $size: { $ifNull: ['$comments', []] } },
				comments: { $slice: ['$comments', 10] }
			}
		});
	}
}

export const Chapter = mongoose.models[label]
	? model<ExtendedChapterProperties>(label)
	: model<ExtendedChapterProperties>(label, chapterSchema);
